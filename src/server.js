// const Joi = require("joi");
// const { configSchema } = require("./validators/config-validator");
// const config = require("config");

// const { error, data } = configSchema.validate(config);
// console.log("Erros found:\n", error);
// console.log("Data found:\n", data);

// Adding Event Signal listner to the application
process.on("SIGINT", require("./utils/signal-handler"));
process.on("SIGTERM", require("./utils/signal-handler"));
process.on("SIGQUIT", require("./utils/signal-handler"));

// Handling uncaught exceptions
// if uncaught exception occurs than our entire node process will be in uncleaned state
// and we have to terminate the entire application immediately
// if uncaught exception occurs in any middlware than express will call the global
// error handler middlware.
// Note: Express will not handle the all uncaught exceptions, thus they will be
// handled by this uncaughtException handler like syntax error etc...
// This must be defined before executing any application code or on the top
process.on("uncaughtException", require("./utils/exit-handler"));

// importing required npm packages
const config = require("config");
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
} = require("./middlewares/morgan-middleware");
const { logger } = require("./utils/logger");
const { rateLimiter } = require("./middlewares/rate-limiter-middleware");
const {
  globalErrorHandler,
} = require("./middlewares/error-handler-middleware");
const { serverHealthCheck } = require("./routes/server-health-route");
const { ApiError } = require("./utils/api-error");
const { secretsInjector } = require("./utils/secrets-injector");
// const routes = require("./routes/v1");
const {
  sentryIntializer,
  sentryRequestHandler,
  sentryTracingHandler,
} = require("./utils/sentry");
const { redisClient } = require("./utils/redis-client");
// Creating express app instance
const app = express();

/**
 * Integrating global middlwares
 */

// Setting origin controls, allowed methods and prohibate requests from unknown origin
// Set methods PUT DELETE PATCH etc to tell preflight requests whether method is allowed or not
// setting optionsSuccessStatus 200, some legacy browsers (IE11, various SmartTVs) choke on 204
// To allow multiple origins use array of origins inside cors options do import from config
app.use(
  cors({
    origin: config.ALLOWED_ORIGIN ? config.ALLOWED_ORIGIN : "*",
    methods: config.ALLOWED_METHODS ? config.ALLOWED_METHODS : "*",
    optionsSuccessStatus: 200,
  })
);

// Adding the morgan http requestt logger middleware, should come before any routes
app.use(successfulHttpLog);
app.use(unsuccessfulHttpLog);

// Adding api rate limiter, use only for production environment
// eslint-disable-next-line
const _ = config.NODE_ENV === "production" ? app.use(rateLimiter) : null;

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

// Adding server health check route
// http://[instance-ip]/
app.use(serverHealthCheck);

// app.use("/v1", routes);

// Hnadling unknown routes on this server
app.use("*", (req, res, next) => next(new ApiError(404, `Not found`)));

// Adding global error handler middleware, Must be after all routes and before server intialization
app.use(globalErrorHandler);

/**
 * Initializing server
 */

// Creating server instance
const server = http.createServer(app);

/**
 * Fetch secrets and inject secrets into the process environment that need on the time
 * of api call or required by other service like db connection sentry etc...
 * Establish database connection
 * Bind the port number to server intance to listen incomming requests
 */

// Injecting secrets into the process
secretsInjector()
  .then((injectorStatus) => {
    logger.info(injectorStatus);

    return new Promise((resolve, reject) => {
      // Initiazing sentry setup to monitor the server
      sentryIntializer(app)
        .then((sentryStatus) => {
          app.use(sentryRequestHandler);
          app.use(sentryTracingHandler);
          resolve(sentryStatus);
        })
        .catch((err) => {
          reject(err);
        });
    });
  })
  .then((sentryStatus) => {
    logger.info(sentryStatus);

    return new Promise((resolve, reject) => {
      redisClient()
        .then((redisStatus) => {
          resolve(redisStatus);
        })
        .catch((err) => {
          reject(err);
        });
    });
  })
  .then((redisStatus) => {
    logger.info(redisStatus);
    // Establishing database connection
    mongoose.set("strictQuery", false);

    return new Promise((resolve, reject) => {
      mongoose
        .connect(config.DB_CONNECTION_STRING, {
          useUnifiedTopology: true,
          useNewUrlParser: true,
        })
        .then(() => {
          resolve("Connected to database");
        })
        .catch((err) => {
          reject(err);
        });
    });
  })
  .then((databaseStatus) => {
    logger.info(databaseStatus);

    // Everything is ready, let's take server up
    server.listen(config.SERVER_PORT || 4000, () => {
      logger.info("Listening on port 4000");
    });
  })
  .catch((err) => {
    logger.error(err);
    logger.info("Server closed due to unexpected error");
    process.exit(0);
  });

// Handling unhandled promise rejections in entire application
// usually they occurs by bad input or network problem
process.on("unhandledRejection", (err) => {
  logger.error(err);

  // do not use process.exit(0) directly, this will abort all the running processes
  // and terminate the application
  // process.exit(0);
  // In this case always close server gracefully, give time to server to fulfill current processes and
  // then terminate the application and that's why this node event listner defined
  // at the bottom or after the server running. It can also handle the
  // unhandledRejection in middlwares if not handled in the middleware
  // below code is the implementation for the same to close server gracefully
  server.close(() => {
    logger.info("Server is closed due to unhandled promise rejection");
    process.exit(0);
  });
});
