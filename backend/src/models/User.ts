import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    companyId: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    passwordResetTokenHash: { type: String, default: '' },
    passwordResetExpires: { type: Date, default: null },
    role: {
      type: String,
      enum: ['hr', 'employee'],
      default: 'employee'
    },
    profileCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null }
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
