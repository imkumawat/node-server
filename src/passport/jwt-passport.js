const { Strategy, ExtractJwt } = require("passport-jwt");
const config = require("config");
const { verifyJwtCallback } = require("../services/jwt-service");

const options = {};

// telling to passport to extract jwt from req header and type of toke is Bearer
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// providing jwt secret to passport to verify the extracted jwt token
options.secretOrKey = config.JWT.PUBLIC_KEY;
options.algorithms = [config.JWT.ALGORITHM];

// exporting the prepared strategy to use with passport in main file
// so that we can use this passport strategy at anywhere
module.exports = new Strategy(options, verifyJwtCallback);
