import { Router } from 'express';
import { prisma } from '../config/database';
import { isConnected } from '../services/rabbitmq.service';

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

export default router;
