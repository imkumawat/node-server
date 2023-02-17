const config = require("config");
const sentry = require("@sentry/node");
const tracing = require("@sentry/tracing");

// We must use sentry only for production environment only
// We can use for development environment to catch errors
// Once application is production ready, we can delete sentry
// for development environment

/**
 *
 * @param {Express} expressInstance
 * @returns Promise
 */
exports.sentryIntializer = (expressInstance) => {
  try {
    sentry.init({
      environment: config.NODE_ENV,
      dsn: config.SENTRY.DSN,
      integrations: [
        new sentry.Integrations.Http({ tracing: true }),
        new tracing.Integrations.Express({ expressInstance }),
      ],
      tracesSampleRate: 1.0,
      attachStacktrace: true,
    });
    return Promise.resolve("Intialized Sentry");
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.sentryRequestHandler = sentry.Handlers.requestHandler();
exports.sentryTracingHandler = sentry.Handlers.tracingHandler();

// we are using customized error collecting in globalErrorHandler middleware
// exports.sentryErrorHandler = sentry.Handlers.errorHandler();

/**
 * Note Sentry will always capture database erros or  ApiError with status 500
 * in default mode(used as global middleware) below code is implementation
 * Adding Sentry Error Handler, must be before any error handler
 * app.use(sentryErrorHandler);
 */
