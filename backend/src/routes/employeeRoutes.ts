import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/invite', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.inviteEmployee as any);
router.get('/invite/verify', EmployeeController.verifyInvitation as any);
router.post('/register', EmployeeController.registerInvitedEmployee as any);
router.post('/resign', authenticateJWT as any, requireRoles(['employee']) as any, EmployeeController.resign as any);
router.get('/resignations', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.listResignations as any);
router.put('/resignations/:id/review', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.reviewResignation as any);
router.get('/', authenticateJWT as any, EmployeeController.getEmployees as any);
router.get('/:id', authenticateJWT as any, EmployeeController.getEmployeeById as any);
router.post('/', authenticateJWT as any, requireRoles(['hr']) as any, upload.single('photo'), EmployeeController.createEmployee as any);
router.put('/:id', authenticateJWT as any, requireRoles(['hr']) as any, upload.single('photo'), EmployeeController.updateEmployee as any);
router.delete('/:id', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.deleteEmployee as any);
router.post('/:id/promote', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.promote as any);
router.post('/:id/transfer', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.transfer as any);
router.post('/:id/warning', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.warn as any);
router.post('/:id/suspend', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.suspend as any);
router.post('/:id/terminate', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.terminate as any);

router.get('/:id/offer-letter', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.generateOfferLetter as any);
router.get('/:id/contract', authenticateJWT as any, requireRoles(['hr']) as any, EmployeeController.generateContract as any);

export default router;
