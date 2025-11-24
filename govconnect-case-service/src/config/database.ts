import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database query', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});

prisma.$on('error', (e: any) => {
  logger.error('Database error', { error: e.message });
});

prisma.$on('warn', (e: any) => {
  logger.warn('Database warning', { message: e.message });
});

export default prisma;
export { prisma };
