import * as Sentry from '@sentry/nextjs';
import { logger, startPerformanceMeasurement, endPerformanceMeasurement, logError } from './logger';
import type pino from 'pino';

/**
 * Performance monitoring utilities that integrate with both
 * local logging (pino) and external monitoring (Sentry)
 */

export interface MonitoringContext {
  operation: string;
  projectId?: string;
  taskId?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Track a performance-critical operation with both local and Sentry monitoring
 */
export async function withPerformanceMonitoring<T>(
  context: MonitoringContext,
  operation: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> {
  const measurement = startPerformanceMeasurement(context.operation, context);

  // Start Sentry span if available
  const sentrySpan = Sentry.startInactiveSpan({
    name: context.operation,
    op: 'function',
    attributes: {
      ...(context.projectId && { 'project.id': context.projectId }),
      ...(context.taskId && { 'task.id': context.taskId }),
      ...(context.action && { action: context.action }),
    },
  });

  try {
    const result = await operation();
    sentrySpan?.end();
    endPerformanceMeasurement(measurement, log);
    return result;
  } catch (error) {
    sentrySpan?.setStatus({ code: 2, message: 'error' });
    sentrySpan?.end();

    // Log the error
    logError(error, context, log);

    // Report to Sentry
    Sentry.captureException(error, {
      extra: context,
    });

    throw error;
  }
}

/**
 * Track API request performance
 */
export interface ApiRequestContext {
  method: string;
  path: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export function startApiTransaction(context: ApiRequestContext) {
  const startTime = performance.now();

  logger.info({
    type: 'api_request_start',
    ...context,
  }, `${context.method} ${context.path} started`);

  return {
    startTime,
    context,
    end: (statusCode: number, additionalContext?: Record<string, unknown>) => {
      const duration = performance.now() - startTime;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      logger[level]({
        type: 'api_request_end',
        ...context,
        ...additionalContext,
        statusCode,
        duration_ms: Math.round(duration * 100) / 100,
      }, `${context.method} ${context.path} ${statusCode} ${duration.toFixed(2)}ms`);

      // Report slow requests to monitoring
      if (duration > 1000) {
        logger.warn({
          type: 'slow_request',
          ...context,
          duration_ms: duration,
          threshold_ms: 1000,
        }, `Slow request detected: ${context.method} ${context.path} took ${duration.toFixed(2)}ms`);
      }
    },
  };
}

/**
 * Track file operation performance
 */
export async function withFileOperationMonitoring<T>(
  operation: string,
  filePath: string,
  fn: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: `file:${operation}`,
      filePath,
    },
    fn,
    log
  );
}

/**
 * Track markdown parsing performance
 */
export async function withMarkdownParsingMonitoring<T>(
  projectId: string,
  fn: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: 'markdown:parse',
      projectId,
    },
    fn,
    log
  );
}

/**
 * Track markdown update performance
 */
export async function withMarkdownUpdateMonitoring<T>(
  projectId: string,
  action: string,
  fn: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> {
  return withPerformanceMonitoring(
    {
      operation: 'markdown:update',
      projectId,
      action,
    },
    fn,
    log
  );
}

/**
 * Health check metrics
 */
export interface HealthMetrics {
  uptime: number;
  timestamp: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

export function getHealthMetrics(): HealthMetrics {
  const memoryUsage = process.memoryUsage();

  return {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
    },
  };
}

/**
 * Log application startup
 */
export function logApplicationStartup(additionalInfo?: Record<string, unknown>): void {
  logger.info({
    type: 'application_startup',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV,
    ...additionalInfo,
  }, 'Application starting');
}

/**
 * Log application shutdown
 */
export function logApplicationShutdown(reason?: string): void {
  logger.info({
    type: 'application_shutdown',
    reason,
    ...getHealthMetrics(),
  }, `Application shutting down${reason ? `: ${reason}` : ''}`);
}

/**
 * Create a request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const monitoring = {
  withPerformanceMonitoring,
  startApiTransaction,
  withFileOperationMonitoring,
  withMarkdownParsingMonitoring,
  withMarkdownUpdateMonitoring,
  getHealthMetrics,
  logApplicationStartup,
  logApplicationShutdown,
  generateRequestId,
};

export default monitoring;
