import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { EmailService } from '../services/emailService';

export class AuthController {
  private static passwordIsStrong(password: string) {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);
  }

  private static async generateCompanyId() {
    let companyId = '';
    let exists = true;

    while (exists) {
      companyId = `co_${crypto.randomBytes(5).toString('hex')}`;
      exists = Boolean(await Company.exists({ companyId }));
    }

    return companyId;
  }

  private static buildToken(user: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return jwt.sign(
      {
        userId: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId._id || user.employeeId : undefined
      },
      secret,
      { expiresIn: '7d' }
    );
  }

  private static publicUser(user: any, company?: any) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      company: company?.name,
      role: user.role,
      employeeId: user.employeeId ? user.employeeId._id || user.employeeId : undefined,
      profileCompleted: user.profileCompleted
    };
  }

  static async signup(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, phone = '', company = '', password } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const companyName = String(company || '').trim();

      if (!name || !normalizedEmail || !password || !companyName) {
        return res.status(400).json({ message: 'Name, email, company, and password are required' });
      }

      if (!AuthController.passwordIsStrong(password)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
        });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const companyId = await AuthController.generateCompanyId();
      const companyDoc = await Company.create({
        companyId,
        name: companyName,
        settings: {
          timezone: req.body.timezone || 'Africa/Lagos',
          currency: req.body.currency || 'NGN'
        }
      });

      const user = await User.create({
        name,
        email: normalizedEmail,
        phone,
        companyId,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'hr',
        profileCompleted: true,
        isActive: true
      });

      const token = AuthController.buildToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: AuthController.publicUser(user, companyDoc)
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      res.status(500).json({ message: 'Error creating account', error: error.message });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const { password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email }).populate('employeeId');
      if (!user || !user.isActive) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const company = await Company.findOne({ companyId: user.companyId });
      const token = AuthController.buildToken(user);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: AuthController.publicUser(user, company)
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ email });

      if (user && user.isActive) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        user.passwordResetTokenHash = resetTokenHash;
        user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
        await user.save();

        EmailService.sendPasswordReset({
          email,
          name: user.name,
          resetToken,
          resetUrl
        }).catch((error) => {
          console.error('[Auth Controller] Failed to trigger password reset workflow:', error.message);
        });
      }

      return res.json({
        success: true,
        message: 'If an account exists for that email, a password reset email will be sent.'
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error starting password reset', error: error.message });
    }
  }

  static async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, token, password } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!normalizedEmail || !token || !password) {
        return res.status(400).json({ message: 'Email, token, and password are required' });
      }

      if (!AuthController.passwordIsStrong(password)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
        });
      }

      const resetTokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
      const user = await User.findOne({
        email: normalizedEmail,
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpires: { $gt: new Date() },
        isActive: true
      });

      if (!user) {
        return res.status(400).json({ message: 'Reset link is invalid or expired' });
      }

      user.passwordHash = await bcrypt.hash(password, 10);
      user.passwordResetTokenHash = '';
      user.passwordResetExpires = null;
      await user.save();

      const company = await Company.findOne({ companyId: user.companyId });
      const tokenJwt = AuthController.buildToken(user);

      return res.json({
        success: true,
        token: tokenJwt,
        user: AuthController.publicUser(user, company)
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
      }

      if (!AuthController.passwordIsStrong(newPassword)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
        });
      }

      const user = await User.findOne({ _id: req.user.id, companyId: req.user.companyId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error changing password', error: error.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await User.findOne({ _id: req.user.id, companyId: req.user.companyId })
        .select('-passwordHash -passwordResetTokenHash -passwordResetExpires')
        .populate('employeeId');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const company = await Company.findOne({ companyId: user.companyId });
      res.json({ user: AuthController.publicUser(user, company), company });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  }
}
