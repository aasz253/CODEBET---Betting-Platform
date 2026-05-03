import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createGameSession, placeBet, cashOut, getGameHistory } from '../controllers/crashGamesController';

const router = Router();

router.use(authenticate);

router.post('/session', createGameSession);
router.post('/bet', placeBet);
router.post('/cashout', cashOut);
router.get('/history', getGameHistory);

export default router;
