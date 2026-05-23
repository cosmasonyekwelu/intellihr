import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', authenticateJWT as any, EmployeeController.getEmployees as any);
router.get('/:id', authenticateJWT as any, EmployeeController.getEmployeeById as any);
router.post('/', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, upload.single('photo'), EmployeeController.createEmployee as any);
router.put('/:id', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, upload.single('photo'), EmployeeController.updateEmployee as any);
router.delete('/:id', authenticateJWT as any, requireRoles(['admin']) as any, EmployeeController.deleteEmployee as any);

router.get('/:id/offer-letter', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, EmployeeController.generateOfferLetter as any);
router.get('/:id/contract', authenticateJWT as any, requireRoles(['admin', 'hr_manager']) as any, EmployeeController.generateContract as any);

export default router;
