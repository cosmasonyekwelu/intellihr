import { Response } from 'express';
import { Employee } from '../models/Employee';
import { AuthenticatedRequest } from '../middleware/auth';
import { N8nService } from '../services/n8nService';

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

      const newEmployee = await Employee.create({
        name,
        email,
        phone,
        position,
        department,
        salary,
        hireDate: hireDate || new Date(),
        status: status || 'active',
        performanceRating: performanceRating || 3
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

      const employee = await Employee.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
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
}
