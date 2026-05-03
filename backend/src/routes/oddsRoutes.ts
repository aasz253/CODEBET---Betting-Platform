import { Router } from 'express';
import { getLiveOdds, getEventMarkets } from '../controllers/oddsController';
import { getEvents, getSports, getLeagues, getLiveMatch } from '../controllers/eventController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/live', getLiveOdds);
router.get('/event/:eventId', getEventMarkets);
router.get('/events', getEvents);
router.get('/events/sports', getSports);
router.get('/events/leagues', getLeagues);
router.get('/events/:eventId/live', getLiveMatch);

export default router;
