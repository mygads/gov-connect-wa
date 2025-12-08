/**
 * Channel Service Client with Circuit Breaker
 */

import { createHttpClient } from '../shared/http-client';
import config from '../config/env';

const channelServiceClient = createHttpClient('channel-service', {
  baseURL: config.channelServiceUrl,
  timeout: 10000,
  retries: 3,
  headers: {
    'X-API-Key': config.internalApiKey,
  },
  circuitBreakerOptions: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 30000,
  },
});

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(data: {
  to: string;
  message: string;
  mediaUrl?: string;
}) {
  try {
    const response = await channelServiceClient.post('/internal/send', data);
    return response.data;
  } catch (error: any) {
    console.error('[ChannelServiceClient] Failed to send message:', error.message);
    throw error;
  }
}

/**
 * Get circuit breaker metrics
 */
export function getChannelServiceMetrics() {
  return channelServiceClient.getMetrics();
}

export default {
  sendWhatsAppMessage,
  getChannelServiceMetrics,
};
