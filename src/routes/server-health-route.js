const app = require("express");
const mongoose = require("mongoose");
const moment = require("moment");

const router = app.Router();

exports.serverHealthCheck = router.get("/health", async (req, res) => {
  // Collecting server info
  const serverHealth = {
    server_status: "Active",
    server_health: "Okay",
    server_uptime: process.uptime(),
    server_time: moment.unix(moment().unix()).format("DD-MM-YYYY HH:mm:ss"),
    node_version: process.version,
    db_connection: mongoose.STATES[mongoose.connection.readyState],
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error();
    }

    res.status(200).send(serverHealth);
  } catch (err) {
    res.status(503).send(serverHealth);
  }
});
