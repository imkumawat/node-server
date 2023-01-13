const httpStatus = require("http-status");
const { ApiError } = require("../utils/ApiError");
const { logger } = require("../utils/logger");

// eslint-disable-next-line no-unused-vars
exports.globalErrorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (!(err instanceof ApiError)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[parseInt(statusCode, 10)];
  }

  if (process.env.NODE_ENV === "development") {
    logger.error(err);
  }
  // if env is development then we will send error stack
  // this will developers to identify error

  // console.log(stack);
  res.status(statusCode).json({
    status: "fail",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
