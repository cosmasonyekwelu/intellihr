import { Schema, model } from 'mongoose';

const conversationSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    userQuestion: { type: String, required: true },
    aiAnswer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Conversation = model('Conversation', conversationSchema);
