// Adding Event Signal listner to the application
process.on("SIGINT", require("./utils/signalHandler"));
process.on("SIGTERM", require("./utils/signalHandler"));
process.on("SIGQUIT", require("./utils/signalHandler"));

// Handling uncaught exceptions
// if uncaught exception occurs than our entire node process will be in uncleaned state
// and we have to terminate the entire application immediately
// if uncaught exception occurs in any middlware than express will call the global
// error handler middlware
// This must be defined before executing any application code or on the top
process.on("uncaughtException", require("./utils/exitHandler"));

// importing required npm packages
require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const mongoose = require("mongoose");

// importing custom packages and middlewares
const {
  successfulHttpLog,
  unsuccessfulHttpLog,
} = require("./middlewares/morgan.middleware");
const { logger } = require("./utils/logger");
const { rateLimiter } = require("./middlewares/rateLimiter.middleware");
const {
  globalErrorHandler,
} = require("./middlewares/globalErrorHandler.middleware");
const { serverHealthCheck } = require("./routes/serverHealth.route");
const { ApiError } = require("./utils/ApiError");

// Creating express app instance
const app = express();

/**
 * Integrating global middlwares
 */

// Setting origin controls, allowed methods and prohibate requests from unknown origin
// Set methods PUT DELETE PATCH to tell preflight requests whether method is allowed or not
// Do not add methods GET POST as preflight requests will not come for them.
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS : "*",
    methods: process.env.ALLOWED_METHODS ? process.env.ALLOWED_METHODS : "*",
  })
);

// Adding the morgan http requestt logger middleware, should come before any routes
app.use(successfulHttpLog);
app.use(unsuccessfulHttpLog);

// Adding api rate limiter, use only for production environment
// eslint-disable-next-line
const _ = process.env.NODE_ENV === "production" ? app.use(rateLimiter) : null;

// Adding body parser to enable json body format & parsing
// Set the body limit as per the possible request size in your app to avoid buffer overflow attack
// should come before any routes
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));

// Using helmet middleware to set security headers
app.use(helmet());

// Protect against XSS attacks, should come before any routes
// app.use(xssClean());

// Protect against HTTP Parameter Pollution attacks(HPP), should come before any routes
app.use(hpp());

// Remove all keys containing prohibited characters
app.use(mongoSanitize());

// compress request responses
app.use(compression());

/**
 * Defininig routes
 */

// Adding health check route
app.use(serverHealthCheck);

// Hnadling unknown routes on this server
app.use((req, res, next) => next(new ApiError(404, `Not found`)));

// Adding global error handler middleware, Must be after all routes and before server intialization
app.use(globalErrorHandler);

/**
 * Initializing server
 */

// Creating server instance
const server = http.createServer(app);

/**
 * Fetch secrets and inject them into the process environment if needed
 * Establish database connection
 * Bind the port number to server intance to listen incomming requests
 */

// Establishing connection to the database
const DB_STRING = "";
mongoose.set("strictQuery", false);
mongoose
  .connect(DB_STRING, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    logger.info("Connected to database");

    // Fetching secrets and injecting them into process environment

    // Everything is ready, let's take server up
    server.listen(process.env.SERVER_PORT || 4000, () => {
      logger.info("Listening on port 4000");
    });
  });

// Handling unhandled promise rejections in entire application
process.on("unhandledRejection", (err) => {
  logger.error(err);

  // Add the error monitor service or sentry to log error

  // do not use process.exit(0) directly, this will abort all the running processes
  // and terminate the application
  // process.exit(0);
  // In this case always close server gracefully, give time to server to fulfill current processes and
  // then terminate the application and that's why this node event listner defined
  // at the bottom or after the server running so that it can also handle the
  // unhandledRejection in middlwares if not handled in the middleware
  // below code is the implementation for the same to close server gracefully
  server.close(() => {
    logger.info("Server is closed due to unhandled promise rejection");
    process.exit(0);
  });
});
