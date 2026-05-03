import { Router } from 'express';
import { searchEvents } from '../controllers/searchController';

const router = Router();

router.get('/', searchEvents);

export default router;
