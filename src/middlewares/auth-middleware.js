const passport = require("passport");

const passportCallback =
  (requiredRights, req, res, next) =>
  (verifyJwtCallbackError, user, passportAuthenticationError) => {
    if (passportAuthenticationError || !user || verifyJwtCallbackError) {
      return res.status(401).json({ message: "Access Denied" });
    }

    if (requiredRights !== "user") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.user = user;
    return next();
  };

module.exports = (requiredRights) => (req, res, next) => {
  passport.authenticate(
    "jwt",
    { session: false },
    passportCallback(requiredRights, req, res, next)
  )(req, res, next);
};
