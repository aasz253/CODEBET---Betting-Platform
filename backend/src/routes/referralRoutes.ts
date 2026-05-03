import { Router } from 'express';
import { generateReferralCode, getReferralStats, getAvailableBonuses } from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/code', authenticate, generateReferralCode);
router.get('/stats', authenticate, getReferralStats);
router.get('/bonuses', authenticate, getAvailableBonuses);

export default router;
