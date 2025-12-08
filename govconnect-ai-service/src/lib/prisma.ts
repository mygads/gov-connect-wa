/**
 * Prisma Client for AI Service Vector Database
 * 
 * Handles connection to PostgreSQL with pgvector extension
 * Used for storing and querying embeddings
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Test connection on startup
prisma.$connect()
  .then(() => {
    logger.info('Connected to AI Vector Database');
  })
  .catch((error) => {
    logger.error('Failed to connect to AI Vector Database', { error: error.message });
  });

export default prisma;
