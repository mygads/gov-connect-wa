import { Request, Response } from 'express';
import {
  createTicket,
  getTicketById,
  getTicketsList,
  updateTicketStatus,
  getTicketStatistics,
} from '../services/ticket.service';
import logger from '../utils/logger';

/**
 * POST /tiket/create
 * Create new ticket (from AI Service)
 */
export async function handleCreateTicket(req: Request, res: Response) {
  try {
    const ticket = await createTicket(req.body);
    
    return res.status(201).json({
      status: 'success',
      data: {
        ticket_id: ticket.ticket_id,
        status: ticket.status,
      },
    });
  } catch (error: any) {
    logger.error('Create ticket error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /tiket
 * Get tickets list (for Dashboard)
 */
export async function handleGetTickets(req: Request, res: Response) {
  try {
    const filters = {
      status: req.query.status as string,
      jenis: req.query.jenis as string,
      wa_user_id: req.query.wa_user_id as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    };
    
    const result = await getTicketsList(filters);
    
    return res.json({
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    logger.error('Get tickets error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /tiket/:id
 * Get ticket by ID
 */
export async function handleGetTicketById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json({ data: ticket });
  } catch (error: any) {
    logger.error('Get ticket error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /tiket/:id/status
 * Update ticket status (from Dashboard)
 */
export async function handleUpdateTicketStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    const ticket = await updateTicketStatus(id, { status, admin_notes });
    
    return res.json({
      status: 'success',
      data: ticket,
    });
  } catch (error: any) {
    logger.error('Update ticket status error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /tiket/statistics
 * Get ticket statistics
 */
export async function handleGetTicketStatistics(req: Request, res: Response) {
  try {
    const stats = await getTicketStatistics();
    return res.json({ data: stats });
  } catch (error: any) {
    logger.error('Get statistics error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
