import axios from 'axios';
import prisma from '../config/database';
import config from '../config/env';
import logger from '../utils/logger';

interface SendNotificationParams {
  wa_user_id: string;
  message: string;
  notificationType: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const { wa_user_id, message, notificationType } = params;
  
  logger.info('Sending notification', { wa_user_id, notificationType });

  let status = 'failed';
  let errorMsg: string | null = null;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      
      const response = await axios.post(
        `${config.channelServiceUrl}/internal/send`,
        {
          wa_user_id,
          message
        },
        {
          headers: {
            'x-internal-api-key': config.internalApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 || response.status === 201) {
        status = 'sent';
        logger.info('Notification sent successfully', {
          wa_user_id,
          notificationType,
          message_id: response.data.message_id,
          attempt
        });
        break;
      }
    } catch (error: any) {
      errorMsg = error.message;
      
      if (error.response) {
        errorMsg = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout';
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = 'Connection refused - Channel Service not available';
      }

      logger.warn(`Notification send attempt ${attempt} failed`, {
        wa_user_id,
        notificationType,
        error: errorMsg,
        willRetry: attempt < maxRetries
      });

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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
    logger.error('Notification failed after all retries', {
      wa_user_id,
      notificationType,
      attempts: maxRetries,
      lastError: errorMsg
    });
  }
}
