import { Router } from 'express';
import { AiController } from '../controllers/aiController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/ask', authenticateJWT as any, AiController.ask as any);

export default router;
