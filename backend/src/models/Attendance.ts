import { Schema, model } from 'mongoose';

const attendanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    }
  },
  { timestamps: true }
);

export const Attendance = model('Attendance', attendanceSchema);
