import { Router } from 'express';
import { handleGetUserHistory } from '../controllers/user.controller';
import { internalAuth } from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * GET /user/:wa_user_id/history
 * Get user's complaint and ticket history (from AI Service - internal only)
 */
router.get('/:wa_user_id/history', internalAuth, handleGetUserHistory);

export default router;
