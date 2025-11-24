import { Router } from 'express';
import { body } from 'express-validator';
import {
  handleCreateTicket,
  handleGetTickets,
  handleGetTicketById,
  handleUpdateTicketStatus,
  handleGetTicketStatistics,
} from '../controllers/ticket.controller';
import { internalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router: Router = Router();

/**
 * POST /tiket/create
 * Create new ticket (from AI Service - internal only)
 */
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

/**
 * GET /tiket
 * Get tickets list (public - for Dashboard)
 */
router.get('/', handleGetTickets);

/**
 * GET /tiket/statistics
 * Get ticket statistics
 */
router.get('/statistics', handleGetTicketStatistics);

/**
 * GET /tiket/:id
 * Get ticket by ID
 */
router.get('/:id', handleGetTicketById);

/**
 * PATCH /tiket/:id/status
 * Update ticket status (for Dashboard)
 */
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

export default router;
