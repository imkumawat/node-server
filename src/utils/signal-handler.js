const { logger } = require("./logger");

/**
 * @param {NodeJS Process Signal} signal
 */
module.exports = (signal) => {
  logger.error("Server Killed");
  process.exit(signal);
};
