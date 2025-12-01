import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';
import { WhatsAppWebhookPayload, WhatsAppMessage } from '../types/webhook.types';

/**
 * Send text message via clivy-wa-support/genfity-wa API
 * 
 * API Endpoint: POST {WA_API_URL}/chat/send/text
 * Headers: token: <session_token>
 * Body: { "Phone": "628xxx", "Body": "message text" }
 */
export async function sendTextMessage(
  to: string,
  message: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  try {
    if (!config.WA_ACCESS_TOKEN) {
      logger.warn('WhatsApp token not configured, message not sent');
      return {
        success: false,
        error: 'WhatsApp not configured',
      };
    }

    // Normalize phone number - remove any non-digit characters and ensure starts with country code
    const normalizedPhone = normalizePhoneNumber(to);

    const url = `${config.WA_API_URL}/chat/send/text`;

    logger.debug('Sending WhatsApp message', { url, to: normalizedPhone });

    const response = await axios.post(
      url,
      {
        Phone: normalizedPhone,
        Body: message,
      },
      {
        headers: {
          token: config.WA_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    // genfity-wa returns { code: 200, data: { Details: "Sent", Id: "msgid", Timestamp: "..." }, success: true }
    const responseData = response.data.data || response.data;
    const messageId = responseData.Id || responseData.id;
    const isSuccess = response.data.success === true || response.data.code === 200 || responseData.Details === 'Sent';

    if (!isSuccess) {
      logger.warn('WhatsApp API returned non-success response', { 
        to: normalizedPhone,
        response: response.data
      });
      return {
        success: false,
        error: responseData.Message || responseData.message || 'Unknown error from WhatsApp API',
      };
    }

    logger.info('WhatsApp message sent', { 
      to: normalizedPhone, 
      message_id: messageId,
      details: responseData.Details 
    });

    return {
      success: true,
      message_id: messageId,
    };
  } catch (error: any) {
    logger.error('Failed to send WhatsApp message', {
      to,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.Message || error.message,
    };
  }
}

/**
 * Normalize phone number to standard format
 * - Remove non-digit characters
 * - Ensure starts with country code (62 for Indonesia)
 * - Remove @s.whatsapp.net suffix if present
 */
function normalizePhoneNumber(phone: string): string {
  // Remove @s.whatsapp.net suffix
  let normalized = phone.replace(/@s\.whatsapp\.net$/i, '');
  
  // Remove all non-digit characters
  normalized = normalized.replace(/\D/g, '');
  
  // If starts with 0, replace with 62 (Indonesia country code)
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  }
  
  // If doesn't start with country code, add 62
  if (!normalized.startsWith('62') && !normalized.startsWith('+')) {
    normalized = '62' + normalized;
  }
  
  return normalized;
}

// =====================================================
// LEGACY FUNCTIONS (Kept for backward compatibility)
// =====================================================

/**
 * Parse webhook payload and extract message
 * @deprecated Use parseGenfityPayload in webhook.controller.ts instead
 */
export function parseWebhookPayload(payload: WhatsAppWebhookPayload): {
  message: WhatsAppMessage | null;
  from: string | null;
} {
  try {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return { message: null, from: null };
    }

    return {
      message,
      from: message.from,
    };
  } catch (error: any) {
    logger.error('Error parsing webhook payload', { error: error.message });
    return { message: null, from: null };
  }
}

/**
 * Validate webhook signature (optional, for production)
 */
export function validateWebhookSignature(
  _signature: string,
  _body: string,
  _secret: string
): boolean {
  // TODO: Implement HMAC signature verification
  // For now, return true (skip verification in development)
  return true;
}

/**
 * Check if message should be processed
 * @deprecated Now handled directly in webhook.controller.ts
 */
export function shouldProcessMessage(message: WhatsAppMessage): {
  shouldProcess: boolean;
  reason?: string;
} {
  // Only process text messages
  if (message.type !== 'text') {
    return {
      shouldProcess: false,
      reason: 'Not a text message',
    };
  }

  // Check if message is too old (> 5 minutes)
  const messageTime = parseInt(message.timestamp) * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (now - messageTime > fiveMinutes) {
    return {
      shouldProcess: false,
      reason: 'Message too old',
    };
  }

  return { shouldProcess: true };
}
