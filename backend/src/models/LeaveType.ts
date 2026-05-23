import { Schema, model } from 'mongoose';

const leaveTypeSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    allowedDays: { type: Number, required: true, default: -1 },
    carryOver: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true }
  },
  { timestamps: true }
);

leaveTypeSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const LeaveType = model('LeaveType', leaveTypeSchema);
