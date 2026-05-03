import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { setHouseMargin, suspendUser, adjustOdds, getAuditLog, setBetLimits, getDashboardStats, getUsers } from '../controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/suspend-user', suspendUser);
router.put('/adjust-odds', adjustOdds);
router.get('/audit-log', getAuditLog);
router.post('/bet-limits', setBetLimits);
router.post('/house-margin', setHouseMargin);

export default router;
