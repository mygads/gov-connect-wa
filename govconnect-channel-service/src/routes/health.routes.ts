import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { isConnected } from '../services/rabbitmq.service';
import logger from '../utils/logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'channel-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/db', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error: any) {
    logger.error('Database health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

router.get('/rabbitmq', (req: Request, res: Response) => {
  const connected = isConnected();

  if (connected) {
    res.json({
      status: 'ok',
      rabbitmq: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'error',
      rabbitmq: 'disconnected',
    });
  }
});

export default router;
