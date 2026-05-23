import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT as any, PayrollController.getPayroll as any);
router.post('/run', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, PayrollController.runPayroll as any);

export default router;
