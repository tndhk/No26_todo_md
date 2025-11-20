import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Session Replay
    replaysSessionSampleRate: parseFloat(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0'),
    replaysOnErrorSampleRate: parseFloat(process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '0'),

    // Only enable in production for non-dev debugging
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
        // Skip network errors that are common and not actionable
        if (error.message.includes('Network request failed') ||
            error.message.includes('Failed to fetch')) {
          return null;
        }
      }

      return event;
    },

    // Integration configuration
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
