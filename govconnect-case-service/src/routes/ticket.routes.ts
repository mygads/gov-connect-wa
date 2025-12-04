import { Router } from 'express';
import { body } from 'express-validator';
import {
  handleCreateTicket,
  handleGetTickets,
  handleGetTicketById,
  handleUpdateTicketStatus,
  handleGetTicketStatistics,
  handleCancelTicket,
} from '../controllers/ticket.controller';
import { internalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: Router = Router();

router.post(
  '/create',
  internalAuth,
  [
    body('wa_user_id').matches(/^628\d{8,12}$/).withMessage('Invalid phone number'),
    body('jenis')
      .isIn(['surat_keterangan', 'surat_pengantar', 'izin_keramaian'])
      .withMessage('Invalid jenis'),
    body('data_json').isObject().withMessage('data_json must be an object'),
  ],
  validate,
  handleCreateTicket
);

router.get('/', handleGetTickets);
router.get('/statistics', handleGetTicketStatistics);
router.get('/:id', handleGetTicketById);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['pending', 'proses', 'selesai', 'ditolak'])
      .withMessage('Invalid status'),
    body('admin_notes').optional().isString(),
  ],
  validate,
  handleUpdateTicketStatus
);

router.post(
  '/:id/cancel',
  internalAuth,
  [
    body('wa_user_id').matches(/^628\d{8,12}$/).withMessage('Invalid phone number'),
    body('cancel_reason').optional().isString(),
  ],
  validate,
  handleCancelTicket
);

export default router;
