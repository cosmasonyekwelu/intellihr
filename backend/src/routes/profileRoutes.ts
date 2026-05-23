import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT as any, ProfileController.get as any);
router.put('/', authenticateJWT as any, ProfileController.update as any);
router.post('/change-password', authenticateJWT as any, ProfileController.changePassword as any);

export default router;
