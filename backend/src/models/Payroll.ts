import { Schema, model } from 'mongoose';

const payrollSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    deductions: {
      tax: { type: Number, default: 0 },
      pension: { type: Number, default: 0 },
      loan: { type: Number, default: 0 }
    },
    bonuses: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    payslipUrl: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Payroll = model('Payroll', payrollSchema);
