import { Schema, model } from 'mongoose';

const employeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    companyId: { type: String, required: true, index: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    position: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    salary: { type: Number, default: 0 },
    hireDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'invited', 'inactive', 'terminated'],
      default: 'invited'
    },
    invitationToken: { type: String, default: '', index: true },
    invitationExpires: { type: Date, default: null },
    promotions: [{
      fromPosition: String,
      toPosition: String,
      date: Date,
      reason: String
    }],
    transfers: [{
      fromDept: String,
      toDept: String,
      date: Date,
      reason: String
    }],
    warnings: [{
      type: { type: String, enum: ['verbal', 'written', 'final'] },
      date: Date,
      reason: String
    }],
    suspensions: [{
      startDate: Date,
      endDate: Date,
      reason: String,
      paid: Boolean
    }],
    termination: {
      date: Date,
      reason: String,
      type: { type: String, enum: ['resignation', 'layoff', 'fired'] }
    },
    performanceRating: { type: Number, min: 1, max: 5, default: 3 },
    photoUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const Employee = model('Employee', employeeSchema);
