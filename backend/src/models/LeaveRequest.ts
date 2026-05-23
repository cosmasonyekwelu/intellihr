import { Schema, model } from 'mongoose';

const leaveRequestSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['sick', 'annual', 'unpaid'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
