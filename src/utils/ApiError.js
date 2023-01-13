exports.ApiError = class ApiError extends Error {
  constructor(statusCode, message) {
    // constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    // this.isOperational = isOperational;
    // status = statusCode >= 400 && statusCode <=500 ? fail : server error
    Error.captureStackTrace(this, this.constructor);
  }
};
