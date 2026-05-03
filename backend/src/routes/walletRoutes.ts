import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getBalance, deposit, withdraw, getTransactionHistory } from '../controllers/walletController';

const router = Router();

router.use(authenticate);

router.get('/balance', getBalance);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/history', getTransactionHistory);

export default router;
