import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getCampaigns,
  getCampaignById,
  getLeaderboard,
} from '../controllers/campaign.controller';

const router = Router();

router.use(authenticate);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.get('/leaderboard', getLeaderboard);

export default router;

