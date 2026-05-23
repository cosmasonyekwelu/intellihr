import { Response } from 'express';
import { Employee } from '../models/Employee';
import { AuthenticatedRequest } from '../middleware/auth';
import { N8nService } from '../services/n8nService';
import PDFDocument from 'pdfkit';

export class EmployeeController {
  static async getEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, department, status, page = '1', limit = '10' } = req.query;

      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } }
        ];
      }

      if (department) {
        query.department = department;
      }

      if (status) {
        query.status = status;
      }

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Regular employees can only see their own file, but HR and Admins can see all.
      if (req.user && req.user.role === 'employee') {
        const emp = await Employee.findById(req.user.employeeId);
        return res.json({
          employees: emp ? [emp] : [],
          total: emp ? 1 : 0,
          page: 1,
          pages: 1
        });
      }

      const employees = await Employee.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Employee.countDocuments(query);

      res.json({
        employees,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving employees', error: error.message });
    }
  }

  static async getEmployeeById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Role check: employees can only fetch their own ID
      if (req.user && req.user.role === 'employee' && req.user.employeeId !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own file' });
      }

      const employee = await Employee.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({ employee });
    } catch (error: any) {
      res.status(500).json({ message: 'Error retrieving employee', error: error.message });
    }
  }

  static async createEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, phone, position, department, salary, hireDate, status, performanceRating } = req.body;

      if (!name || !email || !phone || !position || !department || !salary) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }

      const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

      const newEmployee = await Employee.create({
        name,
        email,
        phone,
        position,
        department,
        salary,
        hireDate: hireDate || new Date(),
        status: status || 'active',
        performanceRating: performanceRating || 3,
        photoUrl
      });

      // Post asynchronous webhook alerts to Slack channel using n8n integration
      N8nService.triggerSlackNewEmployee(newEmployee).catch(err => {
        console.error('[Employee Controller] Failed to trigger Slack Webhook:', err.message);
      });

      res.status(201).json({
        message: 'Employee created successfully',
        employee: newEmployee
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
  }

  static async updateEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (req.file) {
        updateData.photoUrl = `/uploads/${req.file.filename}`;
      }

      const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee updated successfully',
        employee
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
  }

  static async deleteEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Soft delete by setting status to terminated is optional. Let's do hard delete or soft delete.
      // We will do a direct remove to keep MongoDB neat.
      const employee = await Employee.findByIdAndDelete(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
  }

  static async generateOfferLetter(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const employee = await Employee.findById(id);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${employee.name.replace(/\s+/g, '_')}.pdf`);

      doc.pipe(res);

      doc.fillColor('#1e293b').fontSize(24).text('OFFER OF EMPLOYMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#64748b').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);

      doc.fillColor('#0f172a').fontSize(12).text(`Dear ${employee.name},`);
      doc.moveDown();
      doc.fontSize(10).fillColor('#334155').text(
        `We are pleased to offer you the position of ${employee.position} at IntelliHR. ` +
        `We were impressed with your background and believe you will be a valuable asset to our ${employee.department} department.`
      );
      doc.moveDown();
      doc.text(`Starting Monthly Salary: $${employee.salary.toLocaleString()}`);
      doc.text(`Start Date: ${employee.hireDate.toLocaleDateString()}`);
      doc.moveDown(2);
      doc.text('We look forward to welcoming you to the team!');
      doc.moveDown(4);
      doc.text('Sincerely,');
      doc.moveDown();
      doc.font('Helvetica-Bold').text('IntelliHR Management');

      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: 'Error generating offer letter', error: error.message });
    }
  }

  static async generateContract(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const employee = await Employee.findById(id);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contract_${employee.name.replace(/\s+/g, '_')}.pdf`);

      doc.pipe(res);

      doc.fillColor('#1e293b').fontSize(24).text('EMPLOYMENT CONTRACT', { align: 'center' });
      doc.moveDown();
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      doc.fontSize(10).fillColor('#334155').text(
        `This agreement is made between IntelliHR and ${employee.name} for the position of ${employee.position}.`
      );
      doc.moveDown();
      doc.font('Helvetica-Bold').text('1. Compensation');
      doc.font('Helvetica').text(`The employee will receive a monthly salary of $${employee.salary.toLocaleString()}, subject to standard deductions.`);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('2. Duties');
      doc.font('Helvetica').text(`The employee shall perform duties associated with the role of ${employee.position} within the ${employee.department} department.`);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('3. Termination');
      doc.font('Helvetica').text('Either party may terminate this agreement with proper notice as per company policy.');
      doc.moveDown(4);

      doc.text('__________________________', 50, doc.y);
      doc.text('Employer Signature', 50, doc.y + 15);

      doc.text('__________________________', 350, doc.y - 15);
      doc.text('Employee Signature', 350, doc.y);

      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: 'Error generating contract', error: error.message });
    }
  }
}
