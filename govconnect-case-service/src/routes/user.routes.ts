import { Router } from 'express';
import { handleGetUserHistory } from '../controllers/user.controller';
import { internalAuth } from '../middleware/auth.middleware';

const router: Router = Router();

router.get('/:wa_user_id/history', internalAuth, handleGetUserHistory);

export default router;
