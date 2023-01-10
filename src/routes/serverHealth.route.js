const app = require("express");

const router = app.Router();

exports.serverHealthCheck = router.get("/", async (req, res) => {
  try {
    // Optional: Add further things to check (e.g. connection to dababase, redis cluster etc...)
    const healthcheck = {
      status: "up",
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
    res.status(200).send(healthcheck);
  } catch (e) {
    res.status(503).send(e.message);
  }
});
