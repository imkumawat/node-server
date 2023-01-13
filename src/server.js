// importing required npm packages
const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");

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

// Adding global error handler middleware, Must be after all routes and before server intialization
app.use(globalErrorHandler);

/**
 * Initializing server
 */

// Creating server instance
const server = http.createServer(app);

/**
 * Fetch secrets and inject them into environment
 * Establish database connection
 * Binding the port number to server intance to listen incomming requests
 */

server.listen(process.env.SERVER_PORT || 4000, () => {
  logger.info("Server is running...");
});
