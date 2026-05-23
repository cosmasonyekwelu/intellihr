import { Response } from 'express';
import { LeaveType } from '../models/LeaveType';
import { AuthenticatedRequest } from '../middleware/auth';

export class LeaveTypeController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const leaveTypes = await LeaveType.find({ companyId: req.user?.companyId }).sort({ name: 1 });
      res.json({ leaveTypes });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching leave types', error: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, allowedDays = -1, carryOver = false, requiresApproval = true } = req.body;
      if (!name) return res.status(400).json({ message: 'Leave type name is required' });

      const leaveType = await LeaveType.create({
        companyId: req.user?.companyId,
        name,
        allowedDays: Number(allowedDays),
        carryOver: Boolean(carryOver),
        requiresApproval: Boolean(requiresApproval)
      });
      res.status(201).json({ message: 'Leave type created', leaveType });
    } catch (error: any) {
      if (error.code === 11000) return res.status(409).json({ message: 'Leave type already exists' });
      res.status(500).json({ message: 'Error creating leave type', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const leaveType = await LeaveType.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user?.companyId },
        {
          name: req.body.name,
          allowedDays: req.body.allowedDays,
          carryOver: req.body.carryOver,
          requiresApproval: req.body.requiresApproval
        },
        { new: true, runValidators: true }
      );
      if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
      res.json({ message: 'Leave type updated', leaveType });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating leave type', error: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const leaveType = await LeaveType.findOneAndDelete({ _id: req.params.id, companyId: req.user?.companyId });
      if (!leaveType) return res.status(404).json({ message: 'Leave type not found' });
      res.json({ message: 'Leave type deleted' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting leave type', error: error.message });
    }
  }
}
