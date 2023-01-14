const { logger } = require("./logger");

/**
 * @param {NodeJS Event Error} err
 */
module.exports = (err) => {
  logger.error(err);

  // Add the error monitor service or sentry to log error

  logger.info("Server is closed due to uncaught exception");
  process.exit(0);
};
