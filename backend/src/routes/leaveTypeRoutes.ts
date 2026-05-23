import { Router } from 'express';
import { LeaveTypeController } from '../controllers/leaveTypeController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT as any, LeaveTypeController.list as any);
router.post('/', authenticateJWT as any, requireRoles(['hr']) as any, LeaveTypeController.create as any);
router.put('/:id', authenticateJWT as any, requireRoles(['hr']) as any, LeaveTypeController.update as any);
router.delete('/:id', authenticateJWT as any, requireRoles(['hr']) as any, LeaveTypeController.delete as any);

export default router;
