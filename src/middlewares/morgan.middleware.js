const morgan = require("morgan");
const { logger } = require("../utils/logger");

// Passing error message received from error middlware if any error occurs
morgan.token("message", (req, res) => res.locals.errorMessage || "");

// Finalizing the request source ip address
const getIpFormat = () =>
  process.env.NODE_ENV === "production" ? ":remote-addr" : "127.0.0.1";

// Finalizing the logger message for succuessful reuqest and invalid request
const successfulHttpLogMessage = `${getIpFormat()} :method :url :status :response-time ms`;
const unsuccessfulHttpLogMessage = `${getIpFormat()} :method :url :status :response-time ms message: :message`;

exports.successfulHttpLog = morgan(successfulHttpLogMessage, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

exports.unsuccessfulHttpLog = morgan(unsuccessfulHttpLogMessage, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});
