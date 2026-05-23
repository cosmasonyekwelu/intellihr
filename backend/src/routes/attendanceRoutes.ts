import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/checkin', authenticateJWT as any, AttendanceController.checkIn as any);
router.post('/checkout', authenticateJWT as any, AttendanceController.checkOut as any);
router.get('/report', authenticateJWT as any, AttendanceController.getReport as any);

export default router;
