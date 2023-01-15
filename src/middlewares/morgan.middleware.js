const config = require("config");
const morgan = require("morgan");
const { logger } = require("../utils/logger");

// Finalizing the request source ip address
const getIpFormat = () =>
  config.NODE_ENV === "production" ? ":remote-addr" : "127.0.0.1";

// Finalizing the logger message for succuessful reuqest and invalid request
const successfulHttpLogMessage = `${getIpFormat()} :method :url :status :response-time ms`;
const unsuccessfulHttpLogMessage = `${getIpFormat()} :method :url :status :response-time ms`;

exports.successfulHttpLog = morgan(successfulHttpLogMessage, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

exports.unsuccessfulHttpLog = morgan(unsuccessfulHttpLogMessage, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});
