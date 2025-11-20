import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',

    // Filtering
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }

      // Filter out certain error types if needed
      const error = hint.originalException;
      if (error instanceof Error) {
        // Skip expected errors
        if (error.message.includes('ENOENT') && error.message.includes('.md')) {
          // File not found for markdown files - might be expected
          return null;
        }
      }

      return event;
    },

    // Additional server-side configuration
    spotlight: process.env.NODE_ENV === 'development',
  });
}
