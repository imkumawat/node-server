const httpStatus = require("http-status");
const Sentry = require("@sentry/node");
const { ApiError } = require("../utils/ApiError");
const { logger } = require("../utils/logger");
const {
  MONGOOSE_CAST_ERROR,
  MONGOOSE_DUPLICATE_KEY_ERROR,
  MONGOOSE_VALIDATION_ERROR,
} = require("../constants/errorMessages");

// Handling expected mongodb database errors
// that actually occurs with bad input
// like _id casting, duplicate key or validation errors
// Note these handlers is useful to catch errors on  accidently database updation
// Please do validation and duplicate value checking before creating db
// records and send the meaning ful message back to client

const handleCastError = () =>
  new ApiError(httpStatus.BAD_REQUEST, MONGOOSE_CAST_ERROR);
const handleDuplicateKeyError = () =>
  new ApiError(httpStatus.BAD_REQUEST, MONGOOSE_DUPLICATE_KEY_ERROR);
const handleValidationError = () =>
  new ApiError(httpStatus.BAD_REQUEST, MONGOOSE_VALIDATION_ERROR);

// eslint-disable-next-line
exports.globalErrorHandler = (err, req, res, next) => {
  let statusCode = null;
  let message = null;

  // Handling application level & database level errors beautifully

  // error thrown by ApiError is always operational error
  // sometimes mongodb can throw error that is due to bad payload
  // and we have to mark them as operational error and
  // rest errors are non-operational and we have to capture them
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "CastError") {
    const castErrorObject = handleCastError();
    statusCode = castErrorObject.statusCode;
    message = castErrorObject.message;
  } else if (err.code === 11000) {
    const duplicateKeyErrorObject = handleDuplicateKeyError();
    statusCode = duplicateKeyErrorObject.statusCode;
    message = duplicateKeyErrorObject.message;
  } else if (err.name === "ValidationError") {
    const validationErrorObject = handleValidationError();
    statusCode = validationErrorObject.statusCode;
    message = validationErrorObject.message;
  } else {
    // now it seems the error is unknown
    // Capturing non-operational errors
    Sentry.captureException(err);
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[parseInt(statusCode, 10)];
  }

  if (process.env.NODE_ENV === "development") {
    logger.error(err);
  }
  // if env is development then we will send error stack
  // this will help developers to identify error

  // console.log(stack);
  res.status(statusCode).json({
    status: "fail",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
