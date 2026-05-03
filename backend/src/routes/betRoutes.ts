import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAgeVerified } from '../middleware/ageVerification';
import { createBetSlip, placeBet, getBetHistory, calculateWin } from '../controllers/betController';

const router = Router();

router.use(authenticate);
router.use(requireAgeVerified);

router.post('/slip', createBetSlip);
router.post('/place', placeBet);
router.get('/history', getBetHistory);
router.get('/calculate/:betSlipId', calculateWin);

export default router;
