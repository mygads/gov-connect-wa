import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import complaintRoutes from './routes/complaint.routes';
import ticketRoutes from './routes/ticket.routes';
import statisticsRoutes from './routes/statistics.routes';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { swaggerSpec } from './config/swagger';
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

// Register routes
app.use('/health', healthRoutes);
app.use('/laporan', complaintRoutes);
app.use('/tiket', ticketRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/user', userRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'GovConnect Case Service API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
  },
}));

// OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GovConnect Case Service',
    version: '1.0.0',
    status: 'running',
    docs: '/api-docs',
    endpoints: {
      health: '/health',
      complaints: '/laporan',
      tickets: '/tiket',
      statistics: '/statistics',
      user: '/user/:wa_user_id/history'
    }
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
