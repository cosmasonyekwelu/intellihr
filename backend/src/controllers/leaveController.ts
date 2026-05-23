import { Response } from 'express';
import { LeaveRequest } from '../models/LeaveRequest';
import { Employee } from '../models/Employee';
import { AuthenticatedRequest } from '../middleware/auth';

export class LeaveController {
  static async submitRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ message: 'User is not linked to any Employee file.' });
      }

      const { type, startDate, endDate, reason } = req.body;

      if (!type || !startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'All request fields are required.' });
      }

      const request = await LeaveRequest.create({
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Leave request submitted successfully',
        request
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'approved' | 'rejected'

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (approved/rejected) is required.' });
      }

      const request = await LeaveRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: 'Leave request not found.' });
      }

      request.status = status;
      await request.save();

      // If approved, dynamically update employee status to 'on_leave'
      if (status === 'approved') {
        await Employee.findByIdAndUpdate(request.employeeId, { status: 'on_leave' });
      }

      res.json({
        message: `Leave request ${status} successfully.`,
        request
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating leave request', error: error.message });
    }
  }

  static async getRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, employeeId } = req.query;

      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (req.user && req.user.role === 'employee') {
        query.employeeId = req.user.employeeId;
      } else if (employeeId) {
        query.employeeId = employeeId;
      }

      const requests = await LeaveRequest.find(query)
        .populate('employeeId', 'name position department status')
        .sort({ createdAt: -1 });

      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
  }
}
