import { Response } from 'express';
import { AiService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AiController {
  static async ask(req: AuthenticatedRequest, res: Response) {
    try {
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: 'Question prompt is required.' });
      }

      console.log(`[AI Controller] Query received: "${question}"`);
      const answer = await AiService.askQuestion(question);

      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ message: 'AI Agent failed to resolve question', error: error.message });
    }
  }
}
