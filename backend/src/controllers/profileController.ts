import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProfileController {
  private static passwordIsStrong(password: string) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  }

  static async get(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await User.findOne({ _id: req.user?.id, companyId: req.user?.companyId })
        .select('-passwordHash -passwordResetTokenHash -passwordResetExpires')
        .populate('employeeId');
      const company = await Company.findOne({ companyId: req.user?.companyId });
      res.json({ user, company });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, phone, address, companyName, timezone, currency } = req.body;

      const user = await User.findOneAndUpdate(
        { _id: req.user?.id, companyId: req.user?.companyId },
        { ...(name ? { name } : {}), ...(phone !== undefined ? { phone } : {}) },
        { new: true }
      ).select('-passwordHash -passwordResetTokenHash -passwordResetExpires');

      let employee = null;
      if (req.user?.employeeId) {
        employee = await Employee.findOneAndUpdate(
          { _id: req.user.employeeId, companyId: req.user.companyId },
          { ...(phone !== undefined ? { phone } : {}), ...(address !== undefined ? { address } : {}) },
          { new: true }
        );
      }

      let company = null;
      if (req.user?.role === 'hr') {
        const companyUpdate: Record<string, string> = {};
        if (companyName) companyUpdate.name = companyName;
        if (timezone) companyUpdate['settings.timezone'] = timezone;
        if (currency) companyUpdate['settings.currency'] = currency;

        company = await Company.findOneAndUpdate(
          { companyId: req.user.companyId },
          companyUpdate,
          { new: true }
        );
      }

      res.json({ message: 'Profile updated', user, employee, company });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required' });
      if (!ProfileController.passwordIsStrong(newPassword)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' });
      }

      const user = await User.findOne({ _id: req.user?.id, companyId: req.user?.companyId });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error changing password', error: error.message });
    }
  }
}
