const app = require("express");

const router = app.Router();

exports.serverHealthCheck = router.get("/", (req, res, next) => {
  try {
    // Optional: Add further things to check (e.g. connection to dababase, redis cluster etc...)
    const serverHealth = {
      status: "Active",
      uptime: process.uptime(),
      health: "Okay",
      timestamp: Date.now(),
    };

    res.status(200).send(serverHealth);
  } catch (err) {
    next(err);
    // res.status(503).send(err.message);
  }
});
