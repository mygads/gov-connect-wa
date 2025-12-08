/**
 * Structured Logger for Centralized Logging
 * 
 * Outputs JSON logs that can be easily parsed by Loki/Promtail
 * Includes context, correlation IDs, and structured metadata
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  service?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export class StructuredLogger {
  private serviceName: string;
  private logLevel: LogLevel;

  constructor(serviceName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error
        ? {
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
              ...error,
            },
          }
        : {};

      this.log(LogLevel.ERROR, message, { ...context, ...errorContext });
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // Output as JSON for easy parsing by Loki
    const output = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(this.serviceName, this.logLevel);
    
    // Override log method to include parent context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, childContext?: LogContext) => {
      originalLog(level, message, { ...context, ...childContext });
    };

    return childLogger;
  }
}

/**
 * Create logger instance
 */
export function createLogger(serviceName: string, logLevel?: string): StructuredLogger {
  const level = (logLevel?.toLowerCase() as LogLevel) || LogLevel.INFO;
  return new StructuredLogger(serviceName, level);
}

/**
 * Express middleware for request logging
 */
export function requestLoggerMiddleware(logger: StructuredLogger) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    
    // Attach correlation ID to request
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    // Log request
    logger.info('Incoming request', {
      correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      const logMethod = res.statusCode >= 400 ? 'error' : 'info';
      logger[logMethod]('Request completed', {
        correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  };
}

/**
 * Generate correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
