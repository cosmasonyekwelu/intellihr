import { Response } from 'express';
import { Attendance } from '../models/Attendance';
import { AuthenticatedRequest } from '../middleware/auth';

export class AttendanceController {
  static async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId;
      const companyId = req.user?.companyId;
      if (!employeeId || !companyId) {
        return res.status(400).json({ message: 'User is not linked to an Employee file.' });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const existingRecord = await Attendance.findOne({
        companyId,
        employeeId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingRecord) return res.status(400).json({ message: 'You have already checked in today.' });

      const checkInTime = new Date();
      const nineAM = new Date();
      nineAM.setHours(9, 0, 0, 0);
      const status: 'present' | 'late' = checkInTime.getTime() > nineAM.getTime() ? 'late' : 'present';

      const record = await Attendance.create({
        companyId,
        employeeId,
        date: startOfDay,
        checkIn: checkInTime,
        status
      });

      res.status(201).json({ message: 'Checked in successfully', attendance: record });
    } catch (error: any) {
      res.status(500).json({ message: 'Error checking in', error: error.message });
    }
  }

  static async checkOut(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId;
      const companyId = req.user?.companyId;
      if (!employeeId || !companyId) {
        return res.status(400).json({ message: 'User is not linked to an Employee file.' });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const record = await Attendance.findOne({ companyId, employeeId, date: { $gte: startOfDay, $lte: endOfDay } });
      if (!record) return res.status(404).json({ message: 'No check-in record found for today.' });
      if (record.checkOut) return res.status(400).json({ message: 'You have already checked out today.' });

      record.checkOut = new Date();
      await record.save();

      res.json({ message: 'Checked out successfully', attendance: record });
    } catch (error: any) {
      res.status(500).json({ message: 'Error checking out', error: error.message });
    }
  }

  static async getReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { month, year, employeeId } = req.query;
      if (!month || !year) return res.status(400).json({ message: 'Month and year queries are required.' });

      const targetMonth = parseInt(month as string, 10);
      const targetYear = parseInt(year as string, 10);
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      const query: any = { companyId: req.user?.companyId, date: { $gte: startDate, $lte: endDate } };

      if (req.user?.role === 'employee') query.employeeId = req.user.employeeId;
      else if (employeeId) query.employeeId = employeeId;

      const logs = await Attendance.find(query)
        .populate('employeeId', 'name position department')
        .sort({ date: 1 });

      const stats = { present: 0, late: 0, absent: 0, total: logs.length };
      logs.forEach((log) => {
        if (log.status === 'present') stats.present++;
        if (log.status === 'late') stats.late++;
        if (log.status === 'absent') stats.absent++;
      });

      res.json({ logs, stats });
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving report', error: error.message });
    }
  }
}
