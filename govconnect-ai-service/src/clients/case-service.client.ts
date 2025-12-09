/**
 * Case Service Client with Circuit Breaker
 */

import { createHttpClient } from '../shared/http-client';
import { config } from '../config/env';

const caseServiceClient = createHttpClient('case-service', {
  baseURL: config.caseServiceUrl,
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
 * Get case by ID
 */
export async function getCaseById(caseId: string) {
  try {
    const response = await caseServiceClient.get(`/internal/cases/${caseId}`);
    return response.data;
  } catch (error: any) {
    console.error('[CaseServiceClient] Failed to get case:', error.message);
    throw error;
  }
}

/**
 * Get circuit breaker metrics
 */
export function getCaseServiceMetrics() {
  return caseServiceClient.getMetrics();
}

// Export the client for direct use
export { caseServiceClient };

export default {
  getCaseById,
  getCaseServiceMetrics,
};
