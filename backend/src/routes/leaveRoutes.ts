import { Router } from 'express';
import { LeaveController } from '../controllers/leaveController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.post('/request', authenticateJWT as any, LeaveController.submitRequest as any);
router.get('/my-requests', authenticateJWT as any, requireRoles(['employee']) as any, LeaveController.myRequests as any);
router.get('/pending', authenticateJWT as any, requireRoles(['hr']) as any, LeaveController.pending as any);
router.put('/:id/approve', authenticateJWT as any, requireRoles(['hr']) as any, LeaveController.approve as any);
router.put('/:id/reject', authenticateJWT as any, requireRoles(['hr']) as any, LeaveController.reject as any);
router.get('/', authenticateJWT as any, LeaveController.getRequests as any);

export default router;
