import * as Sentry from '@sentry/nextjs';
import {
  withPerformanceMonitoring,
  startApiTransaction,
  withFileOperationMonitoring,
  withMarkdownParsingMonitoring,
  withMarkdownUpdateMonitoring,
  getHealthMetrics,
  logApplicationStartup,
  logApplicationShutdown,
  generateRequestId,
} from '@/lib/monitoring';
import * as loggerModule from '@/lib/logger';

type MockLogger = {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};

// Mock Sentry
jest.mock('@sentry/nextjs');

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  startPerformanceMeasurement: jest.fn(() => ({ operation: 'test', startTime: Date.now() })),
  endPerformanceMeasurement: jest.fn(),
  logError: jest.fn(),
}));

describe('lib/monitoring', () => {
  const mockSentrySpan = {
    end: jest.fn(),
    setStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Sentry.startInactiveSpan as jest.Mock).mockReturnValue(mockSentrySpan);
    (Sentry.captureException as jest.Mock).mockReturnValue(undefined);
  });

  describe('withPerformanceMonitoring', () => {
    it('should execute operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op' };

      const result = await withPerformanceMonitoring(context, operation);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
    });

    it('should start performance measurement', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op' };

      await withPerformanceMonitoring(context, operation);

      expect(loggerModule.startPerformanceMeasurement).toHaveBeenCalledWith('test_op', context);
    });

    it('should end performance measurement on success', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op' };

      await withPerformanceMonitoring(context, operation);

      expect(loggerModule.endPerformanceMeasurement).toHaveBeenCalled();
    });

    it('should start Sentry span', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op', projectId: 'proj-1', taskId: 'task-1', action: 'update' };

      await withPerformanceMonitoring(context, operation);

      expect(Sentry.startInactiveSpan).toHaveBeenCalledWith({
        name: 'test_op',
        op: 'function',
        attributes: {
          'project.id': 'proj-1',
          'task.id': 'task-1',
          action: 'update',
        },
      });
    });

    it('should end Sentry span on success', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op' };

      await withPerformanceMonitoring(context, operation);

      expect(mockSentrySpan.end).toHaveBeenCalled();
    });

    it('should log error on failure', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      const context = { operation: 'test_op' };

      await expect(withPerformanceMonitoring(context, operation)).rejects.toThrow('Operation failed');

      expect(loggerModule.logError).toHaveBeenCalledWith(error, context, loggerModule.logger);
    });

    it('should report error to Sentry on failure', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      const context = { operation: 'test_op', projectId: 'proj-1' };

      await expect(withPerformanceMonitoring(context, operation)).rejects.toThrow();

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });

    it('should set error status on Sentry span on failure', async () => {
      const error = new Error('Operation failed');
      const operation = jest.fn().mockRejectedValue(error);
      const context = { operation: 'test_op' };

      await expect(withPerformanceMonitoring(context, operation)).rejects.toThrow();

      expect(mockSentrySpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'error' });
      expect(mockSentrySpan.end).toHaveBeenCalled();
    });

    it('should accept custom logger', async () => {
      const customLogger: MockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const operation = jest.fn().mockResolvedValue('result');
      const context = { operation: 'test_op' };

      await withPerformanceMonitoring(context, operation, customLogger);

      expect(loggerModule.endPerformanceMeasurement).toHaveBeenCalledWith(
        expect.anything(),
        customLogger
      );
    });

    it('should include all context fields', async () => {
      const operation = jest.fn().mockResolvedValue('result');
      const context = {
        operation: 'test_op',
        projectId: 'proj-1',
        customField: 'value',
      };

      await withPerformanceMonitoring(context, operation);

      expect(loggerModule.startPerformanceMeasurement).toHaveBeenCalledWith('test_op', context);
    });
  });

  describe('startApiTransaction', () => {
    beforeEach(() => {
      // Mock performance.now()
      jest.spyOn(performance, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log API request start', () => {
      const context = {
        method: 'GET',
        path: '/api/projects',
        requestId: 'req-123',
      };

      startApiTransaction(context);

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        {
          type: 'api_request_start',
          ...context,
        },
        'GET /api/projects started'
      );
    });

    it('should return transaction with end function', () => {
      const context = {
        method: 'POST',
        path: '/api/tasks',
      };

      const transaction = startApiTransaction(context);

      expect(transaction).toHaveProperty('startTime');
      expect(transaction).toHaveProperty('context');
      expect(transaction).toHaveProperty('end');
      expect(typeof transaction.end).toBe('function');
    });

    it('should log success on 2xx status', () => {
      const context = {
        method: 'GET',
        path: '/api/projects',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(1100); // 100ms later
      transaction.end(200);

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api_request_end',
          method: 'GET',
          path: '/api/projects',
          statusCode: 200,
          duration_ms: expect.any(Number),
        }),
        expect.stringContaining('GET /api/projects 200')
      );
    });

    it('should log warning on 4xx status', () => {
      const context = {
        method: 'POST',
        path: '/api/tasks',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(1050);
      transaction.end(404);

      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
        }),
        expect.stringContaining('404')
      );
    });

    it('should log error on 5xx status', () => {
      const context = {
        method: 'DELETE',
        path: '/api/tasks/1',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(1200);
      transaction.end(500);

      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
        }),
        expect.stringContaining('500')
      );
    });

    it('should detect slow requests (>1000ms)', () => {
      const context = {
        method: 'GET',
        path: '/api/projects',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(2500); // 1500ms later
      transaction.end(200);

      expect(loggerModule.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'slow_request',
          duration_ms: 1500,
          threshold_ms: 1000,
        }),
        expect.stringContaining('Slow request detected')
      );
    });

    it('should not warn on fast requests', () => {
      const context = {
        method: 'GET',
        path: '/api/projects',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(1500); // 500ms later
      transaction.end(200);

      const warnCalls = (loggerModule.logger.warn as jest.Mock).mock.calls;
      const slowRequestWarning = warnCalls.find(call => call[0].type === 'slow_request');
      expect(slowRequestWarning).toBeUndefined();
    });

    it('should include additional context in end log', () => {
      const context = {
        method: 'POST',
        path: '/api/tasks',
      };

      const transaction = startApiTransaction(context);

      jest.spyOn(performance, 'now').mockReturnValue(1100);
      transaction.end(201, { taskId: 'task-1', action: 'create' });

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          action: 'create',
        }),
        expect.any(String)
      );
    });
  });

  describe('withFileOperationMonitoring', () => {
    it('should wrap file operation with performance monitoring', async () => {
      const operation = jest.fn().mockResolvedValue('file content');

      const result = await withFileOperationMonitoring('read', '/path/to/file.md', operation);

      expect(result).toBe('file content');
      expect(loggerModule.startPerformanceMeasurement).toHaveBeenCalledWith(
        'file:read',
        expect.objectContaining({
          operation: 'file:read',
          filePath: '/path/to/file.md',
        })
      );
    });

    it('should use custom logger if provided', async () => {
      const customLogger: MockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const operation = jest.fn().mockResolvedValue('result');

      await withFileOperationMonitoring('write', '/path/to/file.md', operation, customLogger);

      expect(loggerModule.endPerformanceMeasurement).toHaveBeenCalledWith(
        expect.anything(),
        customLogger
      );
    });
  });

  describe('withMarkdownParsingMonitoring', () => {
    it('should wrap markdown parsing with performance monitoring', async () => {
      const operation = jest.fn().mockResolvedValue({ tasks: [] });

      const result = await withMarkdownParsingMonitoring('project-1', operation);

      expect(result).toEqual({ tasks: [] });
      expect(loggerModule.startPerformanceMeasurement).toHaveBeenCalledWith(
        'markdown:parse',
        expect.objectContaining({
          operation: 'markdown:parse',
          projectId: 'project-1',
        })
      );
    });
  });

  describe('withMarkdownUpdateMonitoring', () => {
    it('should wrap markdown update with performance monitoring', async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      await withMarkdownUpdateMonitoring('project-1', 'add-task', operation);

      expect(loggerModule.startPerformanceMeasurement).toHaveBeenCalledWith(
        'markdown:update',
        expect.objectContaining({
          operation: 'markdown:update',
          projectId: 'project-1',
          action: 'add-task',
        })
      );
    });
  });

  describe('getHealthMetrics', () => {
    it('should return health metrics', () => {
      const metrics = getHealthMetrics();

      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memory');
      expect(metrics.memory).toHaveProperty('heapUsed');
      expect(metrics.memory).toHaveProperty('heapTotal');
      expect(metrics.memory).toHaveProperty('rss');
    });

    it('should return valid timestamp', () => {
      const metrics = getHealthMetrics();

      expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(metrics.timestamp).getTime()).not.toBeNaN();
    });

    it('should return positive memory values', () => {
      const metrics = getHealthMetrics();

      expect(metrics.memory.heapUsed).toBeGreaterThan(0);
      expect(metrics.memory.heapTotal).toBeGreaterThan(0);
      expect(metrics.memory.rss).toBeGreaterThan(0);
    });

    it('should return non-negative uptime', () => {
      const metrics = getHealthMetrics();

      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logApplicationStartup', () => {
    it('should log startup with basic info', () => {
      logApplicationStartup();

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application_startup',
          nodeVersion: expect.any(String),
          platform: expect.any(String),
          arch: expect.any(String),
          env: expect.any(String),
        }),
        'Application starting'
      );
    });

    it('should include additional info when provided', () => {
      logApplicationStartup({ port: 3000, version: '1.0.0' });

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3000,
          version: '1.0.0',
        }),
        'Application starting'
      );
    });

    it('should log correct Node version', () => {
      logApplicationStartup();

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeVersion: process.version,
        }),
        expect.any(String)
      );
    });
  });

  describe('logApplicationShutdown', () => {
    it('should log shutdown with health metrics', () => {
      logApplicationShutdown();

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application_shutdown',
          uptime: expect.any(Number),
          memory: expect.any(Object),
        }),
        'Application shutting down'
      );
    });

    it('should include reason when provided', () => {
      logApplicationShutdown('SIGTERM received');

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'SIGTERM received',
        }),
        'Application shutting down: SIGTERM received'
      );
    });

    it('should not include reason in message when not provided', () => {
      logApplicationShutdown();

      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.anything(),
        'Application shutting down'
      );
    });
  });

  describe('generateRequestId', () => {
    it('should generate a request ID', () => {
      const requestId = generateRequestId();

      expect(requestId).toMatch(/^req_\d+_[a-z0-9]{7}$/);
    });

    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).not.toBe(id2);
    });

    it('should start with "req_"', () => {
      const requestId = generateRequestId();

      expect(requestId).toMatch(/^req_/);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const requestId = generateRequestId();
      const after = Date.now();

      const timestamp = parseInt(requestId.split('_')[1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should include random component', () => {
      const requestId = generateRequestId();
      const parts = requestId.split('_');

      expect(parts).toHaveLength(3);
      expect(parts[2]).toHaveLength(7);
      expect(parts[2]).toMatch(/^[a-z0-9]{7}$/);
    });
  });
});
