const app = require("express");

const router = app.Router();

exports.serverHealthCheck = router.get("/", (req, res, next) => {
  try {
    // Optional: Add further things to check (e.g. connection to dababase, redis cluster etc...)
    const serverHealth = {
      server_status: "Active",
      server_health: "Okay",
      server_uptime: process.uptime(),
      server_time: new Date().toISOString(),
      node_version: process.version,
    };

    res.status(200).send(serverHealth);
  } catch (err) {
    next(err);
    // res.status(503).send(err.message);
  }
});
