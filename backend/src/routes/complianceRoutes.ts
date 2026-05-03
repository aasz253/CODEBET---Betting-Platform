import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAuditLogs,
  exportAuditLog,
  getDailySummary,
  getResponsibleGamingReport,
  sendComplianceReport,
} from '../controllers/complianceController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/audit-logs', getAuditLogs);
router.get('/export', exportAuditLog);
router.get('/daily-summary', getDailySummary);
router.get('/responsible-gaming-report', getResponsibleGamingReport);
router.post('/send-report', sendComplianceReport);

export default router;
