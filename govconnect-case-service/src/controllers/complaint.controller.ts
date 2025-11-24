import { Request, Response } from 'express';
import {
  createComplaint,
  getComplaintById,
  getComplaintsList,
  updateComplaintStatus,
  getComplaintStatistics,
} from '../services/complaint.service';
import logger from '../utils/logger';

/**
 * POST /laporan/create
 * Create new complaint (from AI Service)
 */
export async function handleCreateComplaint(req: Request, res: Response) {
  try {
    const complaint = await createComplaint(req.body);
    
    return res.status(201).json({
      status: 'success',
      data: {
        complaint_id: complaint.complaint_id,
        status: complaint.status,
      },
    });
  } catch (error: any) {
    logger.error('Create complaint error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /laporan
 * Get complaints list (for Dashboard)
 */
export async function handleGetComplaints(req: Request, res: Response) {
  try {
    const filters = {
      status: req.query.status as string,
      kategori: req.query.kategori as string,
      rt_rw: req.query.rt_rw as string,
      wa_user_id: req.query.wa_user_id as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    };
    
    const result = await getComplaintsList(filters);
    
    return res.json({
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    logger.error('Get complaints error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /laporan/:id
 * Get complaint by ID
 */
export async function handleGetComplaintById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const complaint = await getComplaintById(id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    return res.json({ data: complaint });
  } catch (error: any) {
    logger.error('Get complaint error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /laporan/:id/status
 * Update complaint status (from Dashboard)
 */
export async function handleUpdateComplaintStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    const complaint = await updateComplaintStatus(id, { status, admin_notes });
    
    return res.json({
      status: 'success',
      data: complaint,
    });
  } catch (error: any) {
    logger.error('Update status error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /laporan/statistics
 * Get complaint statistics
 */
export async function handleGetComplaintStatistics(req: Request, res: Response) {
  try {
    const stats = await getComplaintStatistics();
    return res.json({ data: stats });
  } catch (error: any) {
    logger.error('Get statistics error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
