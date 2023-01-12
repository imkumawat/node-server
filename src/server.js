// importing required npm packages
const http = require("http");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

// importing custom packages
const {
  successfulHttpLog,
  unsuccessfulHttpLog,
} = require("./middlewares/morgan.middleware");
const { logger } = require("./utils/logger");
const { serverHealthCheck } = require("./routes/serverHealth.route");

// Creating express instance
const app = express();

/**
 * Integrating middlwares
 */

// Setting origin controls, allowed methods and prohibate requests from unknown origin
// Set methods PUT DELETE to tell preflight requests whether method is allowed or not
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS : "*",
    methods: process.env.ALLOWED_METHODS ? process.env.ALLOWED_METHODS : "*",
  })
);

// Prevent the client-side script from accessing the protected cookie
// Configure this as per the requirement
app.use(
  session({
    secret: process.env.SESSION_SECRET || "abcxyz",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      domain: "example.com",
      path: "foo/bar",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Adding the morgan middleware, should come before any routes
app.use(successfulHttpLog);
app.use(unsuccessfulHttpLog);

// Adding body parser to enable json body format
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

/**
 * Defininig routes
 */

// Adding health check route
app.use("/", serverHealthCheck);

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
