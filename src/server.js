// importing required npm packages
const http = require("http");
const express = require("express");
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

// Adding the morgan middleware

app.use(successfulHttpLog);
app.use(unsuccessfulHttpLog);

/**
 * Defininig routes
 */

// Adding health check route
app.get("/", serverHealthCheck);

/**
 * Initializing server
 */

// Creating server instance
const server = http.createServer(app);

// Binding port number to server intance to listen incomming requests
server.listen(1234, () => {
  logger.info("Server is running...");
});
