import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password, role, employeeEmail } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required signup fields' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // If user is an employee role, attempt to associate with an Employee record
      let employeeId = null;
      if (role === 'employee' || employeeEmail) {
        const targetEmail = employeeEmail || email;
        const emp = await Employee.findOne({ email: targetEmail });
        if (emp) {
          employeeId = emp._id;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'employee',
        employeeId
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email }).populate('employeeId');
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Generate JWT
      const secret = process.env.JWT_SECRET || 'intellihr_default_jwt_secret_key_12345';
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId ? user.employeeId._id : undefined
        },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId ? user.employeeId._id : undefined
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await User.findById(req.user.id).select('-password').populate('employeeId');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  }
}
