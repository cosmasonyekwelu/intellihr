import { Response } from 'express';
import { LeaveRequest } from '../models/LeaveRequest';
import { LeaveType } from '../models/LeaveType';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { N8nService } from '../services/n8nService';

const countDays = (startDate: Date, endDate: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
};

export class LeaveController {
  static async submitRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const employeeId = req.user?.employeeId;
      if (!companyId || !employeeId) return res.status(400).json({ message: 'Employee profile is required.' });

      const { leaveTypeId, startDate, endDate, reason } = req.body;
      if (!leaveTypeId || !startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'Leave type, dates, and reason are required.' });
      }

      const leaveType = await LeaveType.findOne({ _id: leaveTypeId, companyId });
      if (!leaveType) return res.status(404).json({ message: 'Leave type not found.' });

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) return res.status(400).json({ message: 'End date cannot be before start date.' });

      if (leaveType.allowedDays >= 0) {
        const yearStart = new Date(start.getFullYear(), 0, 1);
        const yearEnd = new Date(start.getFullYear(), 11, 31, 23, 59, 59);
        const approved = await LeaveRequest.find({
          companyId,
          employeeId,
          leaveTypeId,
          status: 'approved',
          startDate: { $gte: yearStart, $lte: yearEnd }
        });
        const usedDays = approved.reduce((total, request) => total + countDays(request.startDate, request.endDate), 0);
        const requestedDays = countDays(start, end);

        if (usedDays + requestedDays > leaveType.allowedDays) {
          return res.status(400).json({
            message: `Insufficient ${leaveType.name} balance. Remaining days: ${Math.max(0, leaveType.allowedDays - usedDays)}`
          });
        }
      }

      const request = await LeaveRequest.create({
        companyId,
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        reason,
        status: leaveType.requiresApproval ? 'pending' : 'approved',
        approvedBy: leaveType.requiresApproval ? null : req.user?.id
      });

      if (leaveType.requiresApproval) {
        const employee = await Employee.findOne({ _id: employeeId, companyId }).select('name email department position');
        const hrUsers = await User.find({ companyId, role: 'hr', isActive: true }).select('email name');

        N8nService.triggerLeaveNotification({
          companyId,
          requestId: request._id,
          employeeId,
          employeeName: employee?.name || req.user?.name,
          employeeEmail: employee?.email || req.user?.email,
          leaveType: leaveType.name,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason,
          hrEmails: hrUsers.map((user) => user.email)
        }).catch((error) => {
          console.error('[Leave] Failed to trigger leave notification webhook:', error.message);
        });
      }

      res.status(201).json({ message: 'Leave request submitted successfully', request });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
  }

  static async approve(req: AuthenticatedRequest, res: Response) {
    return LeaveController.setStatus(req, res, 'approved');
  }

  static async reject(req: AuthenticatedRequest, res: Response) {
    return LeaveController.setStatus(req, res, 'rejected');
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    const status = req.body.status;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }
    return LeaveController.setStatus(req, res, status);
  }

  private static async setStatus(req: AuthenticatedRequest, res: Response, status: 'approved' | 'rejected') {
    try {
      const request = await LeaveRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!request) return res.status(404).json({ message: 'Leave request not found.' });

      request.status = status;
      request.approvedBy = req.user?.id as any;
      await request.save();

      res.json({ message: `Leave request ${status} successfully.`, request });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating leave request', error: error.message });
    }
  }

  static async getRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, employeeId } = req.query;
      const query: any = { companyId: req.user?.companyId };

      if (status) query.status = status;
      if (req.user?.role === 'employee') query.employeeId = req.user.employeeId;
      else if (employeeId) query.employeeId = employeeId;

      const requests = await LeaveRequest.find(query)
        .populate('employeeId', 'name position department status')
        .populate('leaveTypeId', 'name allowedDays')
        .sort({ createdAt: -1 });

      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
  }

  static async myRequests(req: AuthenticatedRequest, res: Response) {
    req.query.employeeId = req.user?.employeeId || '';
    return LeaveController.getRequests(req, res);
  }

  static async pending(req: AuthenticatedRequest, res: Response) {
    req.query.status = 'pending';
    return LeaveController.getRequests(req, res);
  }
}
