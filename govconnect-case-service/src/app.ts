import express, { Application } from 'express';
import cors from 'cors';
import complaintRoutes from './routes/complaint.routes';
import ticketRoutes from './routes/ticket.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import logger from './utils/logger';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/laporan', complaintRoutes);
app.use('/tiket', ticketRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GovConnect Case Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      complaints: '/laporan',
      tickets: '/tiket',
    },
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
