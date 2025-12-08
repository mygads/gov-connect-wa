import { Router } from 'express';
import { prisma } from '../config/database';
import { isConnected } from '../services/rabbitmq.service';
import { getNotificationServiceMetrics } from '../clients/notification-service.client';

const router: Router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'govconnect-case-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/database', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

router.get('/rabbitmq', async (req, res) => {
  try {
    const connected = isConnected();
    
    if (connected) {
      res.json({ status: 'ok', rabbitmq: 'connected' });
    } else {
      res.status(503).json({ status: 'error', rabbitmq: 'disconnected' });
    }
  } catch (error: any) {
    res.status(503).json({ status: 'error', rabbitmq: 'error', error: error.message });
  }
});

/**
 * Circuit breaker status endpoint
 */
router.get('/circuit-breakers', (req, res) => {
  try {
    const notificationServiceMetrics = getNotificationServiceMetrics();

    res.json({
      circuitBreakers: {
        notificationService: {
          state: notificationServiceMetrics.state,
          failures: notificationServiceMetrics.failures,
          successes: notificationServiceMetrics.successes,
          totalRequests: notificationServiceMetrics.totalRequests,
          totalFailures: notificationServiceMetrics.totalFailures,
          totalSuccesses: notificationServiceMetrics.totalSuccesses,
          successRate: notificationServiceMetrics.totalRequests > 0
            ? ((notificationServiceMetrics.totalSuccesses / notificationServiceMetrics.totalRequests) * 100).toFixed(2) + '%'
            : 'N/A',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get circuit breaker status',
      message: error.message,
    });
  }
});

export default router;
