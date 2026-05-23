import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Payroll } from '../models/Payroll';
import { Employee } from '../models/Employee';
import { AuthenticatedRequest } from '../middleware/auth';
import { N8nService } from '../services/n8nService';

export class PayrollController {
  static async getPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required.' });
      }

      const targetMonth = parseInt(month as string, 10);
      const targetYear = parseInt(year as string, 10);

      const query: any = {
        month: targetMonth,
        year: targetYear
      };

      if (req.user && req.user.role === 'employee') {
        query.employeeId = req.user.employeeId;
      }

      const records = await Payroll.find(query)
        .populate('employeeId', 'name email position department salary')
        .sort({ netSalary: -1 });

      res.json({ records });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching payroll', error: error.message });
    }
  }

  static async runPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required to run payroll.' });
      }

      console.log(`[Payroll Controller] Manual trigger initiated for ${month}/${year}`);

      // 1. Attempt to invoke the n8n webhook workflow asynchronously
      const n8nResult = await N8nService.triggerPayroll(month, year);

      // 2. Perform a robust local calculation fallback in the DB so that the dashboard functions
      // regardless of whether the self-hosted n8n environment is fully running or accessible.
      const employees = await Employee.find({ status: { $ne: 'terminated' } });
      const createdRecords: any[] = [];

      for (const employee of employees) {
        // Double-check if payroll already exists for this employee for this period
        const existing = await Payroll.findOne({
          employeeId: employee._id,
          month,
          year
        });

        if (existing) {
          createdRecords.push(existing);
          continue;
        }

        const grossSalary = employee.salary;
        const tax = Math.round(grossSalary * 0.12); // 12% tax
        const pension = Math.round(grossSalary * 0.08); // 8% pension
        const loan = 0; // Default loan
        const bonuses = employee.performanceRating >= 4 ? 500 : 0; // Bonus for high performers
        const netSalary = grossSalary - (tax + pension + loan) + bonuses;

        // Compile a dummy payslip URL/file using PDFKit
        const payslipFilename = `payslip_${employee._id}_${month}_${year}.pdf`;
        const publicDir = path.join(__dirname, '..', '..', 'public', 'payslips');
        
        // Ensure directories exist
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, payslipFilename);
        const doc = new PDFDocument({ margin: 50 });
        
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Build elegant payslip design
        doc.fillColor('#1e293b').fontSize(24).text('INTELLIHR PAYSLIP', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).fillColor('#64748b').text(`Date Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Period: ${month}/${year}`, { align: 'right' });
        doc.moveDown();

        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fillColor('#0f172a').fontSize(12).text(`Employee Details`, { underline: true });
        doc.fontSize(10).fillColor('#334155');
        doc.text(`Name: ${employee.name}`);
        doc.text(`Position: ${employee.position}`);
        doc.text(`Department: ${employee.department}`);
        doc.text(`Email: ${employee.email}`);
        doc.moveDown();

        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fillColor('#0f172a').fontSize(12).text(`Salary Computation`, { underline: true });
        doc.fontSize(10).fillColor('#334155');
        doc.text(`(+) Gross Salary: $${grossSalary.toLocaleString()}`);
        doc.text(`(+) Performance Bonus: $${bonuses.toLocaleString()}`);
        doc.text(`(-) Tax Deduction (12%): $${tax.toLocaleString()}`);
        doc.text(`(-) Pension Deduction (8%): $${pension.toLocaleString()}`);
        doc.text(`(-) Loan Recovery: $${loan.toLocaleString()}`);
        doc.moveDown();

        doc.strokeColor('#0f172a').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`NET TAKE HOME: $${netSalary.toLocaleString()}`);
        doc.end();

        const payslipUrl = `/payslips/${payslipFilename}`;

        const payroll = await Payroll.create({
          employeeId: employee._id,
          month,
          year,
          grossSalary,
          deductions: { tax, pension, loan },
          bonuses,
          netSalary,
          payslipUrl,
          generatedAt: new Date()
        });

        createdRecords.push(payroll);
      }

      res.status(200).json({
        message: 'Payroll cycle processed successfully.',
        n8nWebhookResult: n8nResult,
        localCalculations: true,
        count: createdRecords.length
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Error processing payroll cycle', error: error.message });
    }
  }
}
