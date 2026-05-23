import { Schema, model } from 'mongoose';

const employeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    salary: { type: Number, required: true },
    hireDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'terminated'],
      default: 'active'
    },
    performanceRating: { type: Number, min: 1, max: 5, default: 3 },
    photoUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Employee = model('Employee', employeeSchema);
