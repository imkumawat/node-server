/*
 Note this rateLimiter is only for single node application.
 For multiple backend nodes or distributed environment use Redis, Memcached, MongoDB, MySQL, or PostgreSQL
 adapter to store rateLimiter data. Persistent storage is required for distributed system.
 Setting up a rate limiter for API is crucial to protect it from DDOS, unexpected costs, or usage abuse.
 
*/
const httpStatus = require("http-status");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { TOO_MANY_REQUESTS } = require("../constants/error-constants");
const { logger } = require("../utils/logger");

// Configuring rate limiting. Allow at most 1 request per IP address for every 60 sec.
const opts = {
  points: 1, // Point budget.
  duration: 60, // Reset points consumption after every 60 sec.
};

const rateLimiter = new RateLimiterMemory(opts);

exports.rateLimiter = (req, res, next) => {
  // we use it to protect specific or public open routes like password reset email, signup or login
  // or api endpoint that used very rarely from one source or ip

  // Modify these routes as need of the application
  if (
    req.url.startsWith("/auth") ||
    req.url.startsWith("/login") ||
    req.url.startsWith("/register") ||
    req.url.startsWith("/sign-up") ||
    req.url.startsWith("/sign-in") ||
    req.url.startsWith("/forgot-password") ||
    req.url.startsWith("/reset-password") ||
    req.url.startsWith("/change-password") ||
    req.url.startsWith("/logout") ||
    req.url.startsWith("/sign-out")
  ) {
    rateLimiter
      .consume(req.connection.remoteAddress)
      .then((rateLimiterRes) => {
        // setting informational headers
        const headers = {
          "Retry-After": rateLimiterRes.msBeforeNext / 1000,
          "X-RateLimit-Limit": opts.points,
          "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
          "X-RateLimit-Reset": new Date(
            Date.now() + rateLimiterRes.msBeforeNext
          ),
        };
        res.set(headers);

        // Allow request and consume 1 point.
        next();
      })
      .catch((rateLimiterRes) => {
        // setting informational headers
        const headers = {
          "Retry-After": rateLimiterRes.msBeforeNext / 1000,
          "X-RateLimit-Limit": opts.points,
          "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
          "X-RateLimit-Reset": new Date(
            Date.now() + rateLimiterRes.msBeforeNext
          ),
        };
        res.set(headers);

        // Not enough points. Block the request.
        logger.warn("Rejecting request due to rate limiting");
        res
          .status(httpStatus.TOO_MANY_REQUESTS)
          .send(`<h2>${TOO_MANY_REQUESTS}</h2>`);
      });
  } else {
    // Allow request for non-specific or public routes.
    next();
  }
};
