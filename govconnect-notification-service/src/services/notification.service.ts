import prisma from '../config/database';
import logger from '../utils/logger';
import { UrgentAlertEvent } from '../types/event.types';
import { sendWhatsAppMessage } from '../clients/channel-service.client';

interface SendNotificationParams {
  wa_user_id: string;
  message: string;
  notificationType: string;
}

// Admin WhatsApp number from environment or config
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '';

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const { wa_user_id, message, notificationType } = params;
  
  logger.info('Sending notification', { wa_user_id, notificationType });

  let status = 'failed';
  let errorMsg: string | null = null;

  try {
    // Use circuit breaker client (already has retry logic)
    const response = await sendWhatsAppMessage({
      to: wa_user_id,
      message: message,
    });

    status = 'sent';
    logger.info('Notification sent successfully', {
      wa_user_id,
      notificationType,
      message_id: response.message_id,
    });
  } catch (error: any) {
    errorMsg = error.message;
    
    if (error.response) {
      errorMsg = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      errorMsg = 'Request timeout';
    } else if (error.code === 'ECONNREFUSED') {
      errorMsg = 'Connection refused - Channel Service not available';
    }

    logger.error('Notification send failed', {
      wa_user_id,
      notificationType,
      error: errorMsg,
    });
  }

  // Log to database
  try {
    await prisma.notificationLog.create({
      data: {
        wa_user_id,
        message_text: message,
        notification_type: notificationType,
        status,
        error_msg: errorMsg
      }
    });
  } catch (dbError: any) {
    logger.error('Failed to log notification to database', {
      wa_user_id,
      notificationType,
      error: dbError.message
    });
  }

  if (status === 'failed') {
    logger.error('Notification failed', {
      wa_user_id,
      notificationType,
      lastError: errorMsg
    });
  }
}

/**
 * Send urgent alert to admin WhatsApp
 */
export async function sendAdminUrgentAlert(message: string, event: UrgentAlertEvent): Promise<void> {
  // Check if admin WhatsApp is configured
  if (!ADMIN_WHATSAPP) {
    logger.warn('Admin WhatsApp not configured, skipping urgent alert');
    return;
  }

  logger.warn('🚨 Sending URGENT ALERT to admin', {
    admin_whatsapp: ADMIN_WHATSAPP,
    complaint_id: event.complaint_id,
    kategori: event.kategori
  });

  // Send to admin
  await sendNotification({
    wa_user_id: ADMIN_WHATSAPP,
    message,
    notificationType: 'urgent_alert'
  });

  // Log the urgent alert
  try {
    await prisma.notificationLog.create({
      data: {
        wa_user_id: ADMIN_WHATSAPP,
        message_text: `[URGENT ALERT] ${event.complaint_id} - ${event.kategori}`,
        notification_type: 'urgent_alert_admin',
        status: 'sent',
        error_msg: null
      }
    });
  } catch (dbError: any) {
    logger.error('Failed to log urgent alert to database', { error: dbError.message });
  }
}
