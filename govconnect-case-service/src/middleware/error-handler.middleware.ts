import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}
