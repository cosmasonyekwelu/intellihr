import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'hr_manager', 'employee'],
      default: 'employee'
    },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null }
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
