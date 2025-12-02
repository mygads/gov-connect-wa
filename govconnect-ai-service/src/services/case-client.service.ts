import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';

interface ComplaintData {
  wa_user_id: string;
  kategori: string;
  deskripsi: string;
  alamat?: string;
  rt_rw?: string;
  foto_url?: string;
}

interface TicketData {
  wa_user_id: string;
  jenis: string;
  data_json: any;
}

interface ComplaintResponse {
  status: string;
  data: {
    complaint_id: string;
    status: string;
  };
}

interface TicketResponse {
  status: string;
  data: {
    ticket_id: string;
    status: string;
  };
}

/**
 * Create complaint in Case Service (SYNC call)
 */
export async function createComplaint(data: ComplaintData): Promise<string | null> {
  logger.info('Creating complaint in Case Service', {
    wa_user_id: data.wa_user_id,
    kategori: data.kategori,
  });
  
  try {
    const url = `${config.caseServiceUrl}/laporan/create`;
    const response = await axios.post<ComplaintResponse>(
      url,
      data,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds
      }
    );
    
    const complaintId = response.data.data.complaint_id;
    
    logger.info('✅ Complaint created successfully', {
      wa_user_id: data.wa_user_id,
      complaint_id: complaintId,
    });
    
    return complaintId;
  } catch (error: any) {
    logger.error('❌ Failed to create complaint', {
      wa_user_id: data.wa_user_id,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return null;
  }
}

/**
 * Create ticket in Case Service (SYNC call)
 */
export async function createTicket(data: TicketData): Promise<string | null> {
  logger.info('Creating ticket in Case Service', {
    wa_user_id: data.wa_user_id,
    jenis: data.jenis,
  });
  
  try {
    const url = `${config.caseServiceUrl}/tiket/create`;
    const response = await axios.post<TicketResponse>(
      url,
      data,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    const ticketId = response.data.data.ticket_id;
    
    logger.info('✅ Ticket created successfully', {
      wa_user_id: data.wa_user_id,
      ticket_id: ticketId,
    });
    
    return ticketId;
  } catch (error: any) {
    logger.error('❌ Failed to create ticket', {
      wa_user_id: data.wa_user_id,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return null;
  }
}

/**
 * Check if Case Service is available
 */
export async function checkCaseServiceHealth(): Promise<boolean> {
  try {
    const url = `${config.caseServiceUrl}/health`;
    const response = await axios.get(url, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    logger.warn('Case Service health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export interface ComplaintStatusResponse {
  data: {
    complaint_id: string;
    kategori: string;
    alamat: string | null;
    status: string;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface TicketStatusResponse {
  data: {
    ticket_id: string;
    jenis: string;
    status: string;
    admin_notes: string | null;
    data_json: any;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface CancelResponse {
  status: string;
  data?: {
    complaint_id?: string;
    ticket_id?: string;
    message: string;
  };
  error?: string;
  message?: string;
}

export interface CancelResult {
  success: boolean;
  error?: 'NOT_FOUND' | 'NOT_OWNER' | 'ALREADY_COMPLETED' | 'INTERNAL_ERROR';
  message: string;
  complaint_id?: string;
  ticket_id?: string;
}

/**
 * Get complaint status by complaint_id (e.g., LAP-20251201-001)
 */
export async function getComplaintStatus(complaintId: string): Promise<ComplaintStatusResponse['data']> {
  logger.info('Fetching complaint status from Case Service', {
    complaint_id: complaintId,
  });
  
  try {
    const url = `${config.caseServiceUrl}/laporan/${complaintId}`;
    const response = await axios.get<ComplaintStatusResponse>(
      url,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    logger.info('✅ Complaint status fetched successfully', {
      complaint_id: complaintId,
      status: response.data.data?.status,
    });
    
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.info('Complaint not found', { complaint_id: complaintId });
      return null;
    }
    
    logger.error('❌ Failed to fetch complaint status', {
      complaint_id: complaintId,
      error: error.message,
      status: error.response?.status,
    });
    
    return null;
  }
}

/**
 * Get ticket status by ticket_id (e.g., TIK-20251201-001)
 */
export async function getTicketStatus(ticketId: string): Promise<TicketStatusResponse['data']> {
  logger.info('Fetching ticket status from Case Service', {
    ticket_id: ticketId,
  });
  
  try {
    const url = `${config.caseServiceUrl}/tiket/${ticketId}`;
    const response = await axios.get<TicketStatusResponse>(
      url,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    logger.info('✅ Ticket status fetched successfully', {
      ticket_id: ticketId,
      status: response.data.data?.status,
    });
    
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.info('Ticket not found', { ticket_id: ticketId });
      return null;
    }
    
    logger.error('❌ Failed to fetch ticket status', {
      ticket_id: ticketId,
      error: error.message,
      status: error.response?.status,
    });
    
    return null;
  }
}

/**
 * Cancel complaint by user (with owner validation)
 */
export async function cancelComplaint(
  complaintId: string,
  wa_user_id: string,
  cancel_reason?: string
): Promise<CancelResult> {
  logger.info('Cancelling complaint in Case Service', {
    complaint_id: complaintId,
    wa_user_id,
  });
  
  try {
    const url = `${config.caseServiceUrl}/laporan/${complaintId}/cancel`;
    const response = await axios.post<CancelResponse>(
      url,
      {
        wa_user_id,
        cancel_reason,
      },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    logger.info('✅ Complaint cancelled successfully', {
      complaint_id: complaintId,
      message: response.data.data?.message,
    });
    
    return {
      success: true,
      complaint_id: response.data.data?.complaint_id,
      message: response.data.data?.message || 'Dibatalkan oleh pelapor',
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.error as CancelResult['error'];
    const errorMessage = error.response?.data?.message || 'Gagal membatalkan laporan';
    
    logger.error('❌ Failed to cancel complaint', {
      complaint_id: complaintId,
      error: error.message,
      status: error.response?.status,
      errorCode,
    });
    
    return {
      success: false,
      error: errorCode || 'INTERNAL_ERROR',
      message: errorMessage,
    };
  }
}

/**
 * Cancel ticket by user (with owner validation)
 */
export async function cancelTicket(
  ticketId: string,
  wa_user_id: string,
  cancel_reason?: string
): Promise<CancelResult> {
  logger.info('Cancelling ticket in Case Service', {
    ticket_id: ticketId,
    wa_user_id,
  });
  
  try {
    const url = `${config.caseServiceUrl}/tiket/${ticketId}/cancel`;
    const response = await axios.post<CancelResponse>(
      url,
      {
        wa_user_id,
        cancel_reason,
      },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    logger.info('✅ Ticket cancelled successfully', {
      ticket_id: ticketId,
      message: response.data.data?.message,
    });
    
    return {
      success: true,
      ticket_id: response.data.data?.ticket_id,
      message: response.data.data?.message || 'Dibatalkan oleh pemohon',
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.error as CancelResult['error'];
    const errorMessage = error.response?.data?.message || 'Gagal membatalkan tiket';
    
    logger.error('❌ Failed to cancel ticket', {
      ticket_id: ticketId,
      error: error.message,
      status: error.response?.status,
      errorCode,
    });
    
    return {
      success: false,
      error: errorCode || 'INTERNAL_ERROR',
      message: errorMessage,
    };
  }
}

export interface HistoryItem {
  type: 'complaint' | 'ticket';
  id: string;
  display_id: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserHistoryResponse {
  status: string;
  data: {
    complaints: any[];
    tickets: any[];
    combined: HistoryItem[];
    total: number;
  };
}

/**
 * Get user's complaint and ticket history
 */
export async function getUserHistory(wa_user_id: string): Promise<UserHistoryResponse['data'] | null> {
  logger.info('Fetching user history from Case Service', {
    wa_user_id,
  });
  
  try {
    const url = `${config.caseServiceUrl}/user/${wa_user_id}/history`;
    const response = await axios.get<UserHistoryResponse>(
      url,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    logger.info('✅ User history fetched successfully', {
      wa_user_id,
      total: response.data.data.total,
    });
    
    return response.data.data;
  } catch (error: any) {
    logger.error('❌ Failed to fetch user history', {
      wa_user_id,
      error: error.message,
      status: error.response?.status,
    });
    
    return null;
  }
}
