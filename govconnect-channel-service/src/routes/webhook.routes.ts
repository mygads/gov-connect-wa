import { Router } from 'express';
import { handleWebhook, verifyWebhook } from '../controllers/webhook.controller';
import { validateWebhookPayload } from '../middleware/validation.middleware';

const router = Router();

router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', validateWebhookPayload, handleWebhook);

export default router;
