import { Schema, model } from 'mongoose';

const companySchema = new Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    settings: {
      timezone: { type: String, default: 'Africa/Lagos' },
      currency: { type: String, default: 'NGN' }
    }
  },
  { timestamps: true }
);

export const Company = model('Company', companySchema);
