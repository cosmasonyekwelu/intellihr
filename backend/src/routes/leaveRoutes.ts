import { Router } from 'express';
import { LeaveController } from '../controllers/leaveController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.post('/request', authenticateJWT as any, LeaveController.submitRequest as any);
router.put('/:id/approve', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, LeaveController.updateStatus as any);
router.get('/', authenticateJWT as any, LeaveController.getRequests as any);

export default router;
