import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { ResignationRequest } from '../models/ResignationRequest';
import { AuthenticatedRequest } from '../middleware/auth';
import { N8nService } from '../services/n8nService';
import { EmailService } from '../services/emailService';

export class EmployeeController {
  private static passwordIsStrong(password: string) {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);
  }

  private static tenant(req: AuthenticatedRequest) {
    return req.user?.companyId;
  }

  static async inviteEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = EmployeeController.tenant(req);
      if (!companyId) return res.status(401).json({ message: 'Unauthorized tenant session' });

      const { name, email, phone = '', position, department, salary = 0 } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!name || !normalizedEmail || !position || !department) {
        return res.status(400).json({ message: 'Name, email, position, and department are required.' });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ message: 'A user account with this email already exists.' });
      }

      const existingEmployee = await Employee.findOne({ companyId, email: normalizedEmail });
      if (existingEmployee?.status === 'active') {
        return res.status(409).json({ message: 'This employee is already active in your company.' });
      }

      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const company = await Company.findOne({ companyId });

      const employee = await Employee.findOneAndUpdate(
        { companyId, email: normalizedEmail },
        {
          companyId,
          name,
          email: normalizedEmail,
          phone,
          position,
          department,
          salary: Number(salary) || 0,
          hireDate: new Date(),
          status: 'invited',
          invitationToken,
          invitationExpires
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/register/employee?token=${invitationToken}`;

      EmailService.sendEmployeeInvitation({
        email: normalizedEmail,
        name,
        company: company?.name || 'IntelliHR',
        inviteUrl
      }).catch((error) => {
        console.error('[Employee Controller] Failed to trigger invite email workflow:', error.message);
      });

      return res.status(201).json({
        success: true,
        message: 'Employee invitation created.',
        employee,
        inviteUrl
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error inviting employee', error: error.message });
    }
  }

  static async verifyInvitation(req: AuthenticatedRequest, res: Response) {
    try {
      const token = String(req.query.token || '');
      if (!token) return res.status(400).json({ message: 'Invitation token is required.' });

      const employee = await Employee.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: 'invited'
      }).select('name email phone companyId position department salary status invitationExpires');

      if (!employee) {
        return res.status(404).json({ message: 'Invitation is invalid or expired.' });
      }

      const company = await Company.findOne({ companyId: employee.companyId }).select('name settings');
      return res.json({ success: true, employee, company });
    } catch (error: any) {
      res.status(500).json({ message: 'Error verifying invitation', error: error.message });
    }
  }

  static async registerInvitedEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, password, acceptTerms } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Invitation token and password are required.' });
      }

      if (!acceptTerms) {
        return res.status(400).json({ message: 'You must accept the terms to continue.' });
      }

      if (!EmployeeController.passwordIsStrong(password)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
        });
      }

      const employee = await Employee.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: 'invited'
      });

      if (!employee) {
        return res.status(404).json({ message: 'Invitation is invalid or expired.' });
      }

      const existingUser = await User.findOne({ email: employee.email });
      if (existingUser) {
        return res.status(409).json({ message: 'A user account already exists for this employee.' });
      }

      const user = await User.create({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        companyId: employee.companyId,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'employee',
        employeeId: employee._id,
        profileCompleted: true,
        isActive: true
      });

      employee.userId = user._id;
      employee.status = 'active';
      employee.invitationToken = '';
      employee.invitationExpires = null;
      await employee.save();

      return res.status(201).json({
        success: true,
        message: 'Employee registration complete.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          employeeId: employee._id
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error registering employee', error: error.message });
    }
  }

  static async getEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = EmployeeController.tenant(req);
      if (!companyId) return res.status(401).json({ message: 'Unauthorized tenant session' });

      const { search, department, status, page = '1', limit = '10' } = req.query;
      const query: any = { companyId };

      if (req.user?.role === 'employee') {
        query._id = req.user.employeeId;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } }
        ];
      }

      if (department) query.department = department;
      if (status) query.status = status;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const employees = await Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
      const total = await Employee.countDocuments(query);

      res.json({ employees, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving employees', error: error.message });
    }
  }

  static async getEmployeeById(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = EmployeeController.tenant(req);
      const { id } = req.params;

      if (req.user?.role === 'employee' && req.user.employeeId !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own file' });
      }

      const employee = await Employee.findOne({ _id: id, companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      res.json({ employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving employee', error: error.message });
    }
  }

  static async createEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = EmployeeController.tenant(req);
      if (!companyId) return res.status(401).json({ message: 'Unauthorized tenant session' });

      const { name, email, phone, position, department, salary, hireDate, status, performanceRating } = req.body;
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!name || !normalizedEmail || !position || !department) {
        return res.status(400).json({ message: 'Name, email, position, and department are required' });
      }

      const existingEmployee = await Employee.findOne({ companyId, email: normalizedEmail });
      if (existingEmployee) return res.status(409).json({ message: 'Employee with this email already exists' });

      const newEmployee = await Employee.create({
        companyId,
        name,
        email: normalizedEmail,
        phone,
        position,
        department,
        salary: Number(salary) || 0,
        hireDate: hireDate || new Date(),
        status: status || 'active',
        performanceRating: performanceRating || 3,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : ''
      });

      N8nService.triggerSlackNewEmployee(newEmployee).catch((err) => {
        console.error('[Employee Controller] Failed to trigger Slack Webhook:', err.message);
      });

      res.status(201).json({ message: 'Employee created successfully', employee: newEmployee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
  }

  static async updateEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = EmployeeController.tenant(req);
      const { id } = req.params;
      const { role, companyId: ignoredCompanyId, userId, ...safeBody } = req.body;
      const updateData = { ...safeBody };

      if (req.file) updateData.photoUrl = `/uploads/${req.file.filename}`;

      const employee = await Employee.findOneAndUpdate(
        { _id: id, companyId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      res.json({ message: 'Employee updated successfully', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
  }

  static async deleteEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await Employee.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user?.companyId },
        { status: 'inactive' },
        { new: true }
      );
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      if (employee.userId) await User.findOneAndUpdate({ _id: employee.userId, companyId: employee.companyId }, { isActive: false });
      res.json({ message: 'Employee deactivated successfully', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
  }

  static async promote(req: AuthenticatedRequest, res: Response) {
    try {
      const { toPosition, date, reason } = req.body;
      if (!toPosition || !reason) return res.status(400).json({ message: 'New position and reason are required' });

      const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      employee.promotions.push({ fromPosition: employee.position, toPosition, date: date ? new Date(date) : new Date(), reason });
      employee.position = toPosition;
      await employee.save();
      res.json({ message: 'Promotion recorded', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error promoting employee', error: error.message });
    }
  }

  static async transfer(req: AuthenticatedRequest, res: Response) {
    try {
      const { toDept, date, reason } = req.body;
      if (!toDept || !reason) return res.status(400).json({ message: 'New department and reason are required' });

      const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      employee.transfers.push({ fromDept: employee.department, toDept, date: date ? new Date(date) : new Date(), reason });
      employee.department = toDept;
      await employee.save();
      res.json({ message: 'Transfer recorded', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error transferring employee', error: error.message });
    }
  }

  static async warn(req: AuthenticatedRequest, res: Response) {
    try {
      const { type, date, reason } = req.body;
      if (!['verbal', 'written', 'final'].includes(type) || !reason) {
        return res.status(400).json({ message: 'Warning type and reason are required' });
      }

      const employee = await Employee.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user?.companyId },
        { $push: { warnings: { type, date: date ? new Date(date) : new Date(), reason } } },
        { new: true, runValidators: true }
      );
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      res.json({ message: 'Warning recorded', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error issuing warning', error: error.message });
    }
  }

  static async suspend(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, reason, paid = false } = req.body;
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'Start date, end date, and reason are required' });
      }

      const employee = await Employee.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user?.companyId },
        { $push: { suspensions: { startDate: new Date(startDate), endDate: new Date(endDate), reason, paid: Boolean(paid) } } },
        { new: true, runValidators: true }
      );
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      const now = new Date();
      if (new Date(startDate) <= now && new Date(endDate) >= now && employee.userId) {
        await User.findOneAndUpdate({ _id: employee.userId, companyId: employee.companyId }, { isActive: false });
      }

      res.json({ message: 'Suspension recorded', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error suspending employee', error: error.message });
    }
  }

  static async terminate(req: AuthenticatedRequest, res: Response) {
    try {
      const { reason, type = 'fired', date } = req.body;
      if (!reason || !['layoff', 'fired'].includes(type)) {
        return res.status(400).json({ message: 'Termination reason and valid type are required' });
      }

      const employee = await Employee.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user?.companyId },
        { status: 'terminated', termination: { date: date ? new Date(date) : new Date(), reason, type } },
        { new: true, runValidators: true }
      );
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      if (employee.userId) await User.findOneAndUpdate({ _id: employee.userId, companyId: employee.companyId }, { isActive: false });

      res.json({ message: 'Employee terminated', employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error terminating employee', error: error.message });
    }
  }

  static async resign(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.employeeId) return res.status(400).json({ message: 'Employee profile is required' });
      const { reason, lastWorkingDay } = req.body;
      if (!reason || !lastWorkingDay) return res.status(400).json({ message: 'Reason and last working day are required' });

      const employee = await Employee.findOne({ _id: req.user.employeeId, companyId: req.user.companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      const request = await ResignationRequest.create({
        companyId: req.user.companyId,
        employeeId: employee._id,
        userId: req.user.id,
        reason,
        lastWorkingDay: new Date(lastWorkingDay)
      });

      res.status(201).json({ message: 'Resignation request submitted', request });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting resignation', error: error.message });
    }
  }

  static async listResignations(req: AuthenticatedRequest, res: Response) {
    try {
      const requests = await ResignationRequest.find({ companyId: req.user?.companyId })
        .populate('employeeId', 'name position department status')
        .sort({ createdAt: -1 });
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching resignations', error: error.message });
    }
  }

  static async reviewResignation(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Status must be approved or rejected' });

      const request = await ResignationRequest.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!request) return res.status(404).json({ message: 'Resignation request not found' });

      request.status = status;
      request.reviewedBy = req.user?.id as any;
      await request.save();

      if (status === 'approved') {
        const employee = await Employee.findOneAndUpdate(
          { _id: request.employeeId, companyId: request.companyId },
          { status: 'terminated', termination: { date: request.lastWorkingDay, reason: request.reason, type: 'resignation' } },
          { new: true }
        );
        if (employee?.userId) await User.findOneAndUpdate({ _id: employee.userId, companyId: request.companyId }, { isActive: false });
      }

      res.json({ message: `Resignation ${status}`, request });
    } catch (error: any) {
      res.status(500).json({ message: 'Error reviewing resignation', error: error.message });
    }
  }

  static async generateOfferLetter(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${employee.name.replace(/\s+/g, '_')}.pdf`);
      doc.pipe(res);
      doc.fillColor('#1e293b').fontSize(24).text('OFFER OF EMPLOYMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#334155').text(`Dear ${employee.name},`);
      doc.moveDown();
      doc.text(`We are pleased to offer you the position of ${employee.position}.`);
      doc.text(`Department: ${employee.department}`);
      doc.text(`Monthly Salary: ${employee.salary.toLocaleString()}`);
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: 'Error generating offer letter', error: error.message });
    }
  }

  static async generateContract(req: AuthenticatedRequest, res: Response) {
    try {
      const employee = await Employee.findOne({ _id: req.params.id, companyId: req.user?.companyId });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contract_${employee.name.replace(/\s+/g, '_')}.pdf`);
      doc.pipe(res);
      doc.fillColor('#1e293b').fontSize(24).text('EMPLOYMENT CONTRACT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#334155').text(`This agreement is between IntelliHR and ${employee.name}.`);
      doc.text(`Position: ${employee.position}`);
      doc.text(`Department: ${employee.department}`);
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: 'Error generating contract', error: error.message });
    }
  }
}
