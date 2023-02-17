const jwt = require("jsonwebtoken");
const moment = require("moment");
const config = require("config");
const httpStatus = require("http-status");
const { jwtTokens } = require("../models");
const redis = require("../utils/redis-client");

const { ApiError } = require("../utils/api-error");
const {
  INVALID_TOKEN_TYPE_OR_ROLE,
  JWT_TOKEN_EXPIRED,

  INVALID_ACCESS_OR_REFRESH_TOKEN,
} = require("../constants/error-constants");

const {
  generateSecureToken,
  verifySecureToken,
} = require("../utils/secure-token");

/**
 *
 * @param {object} payload User object that contains sensitive data used to identify of a user
 * @param {string} type  Type of jwt token to be generated, default is access token
 * @param {boolean} rememberMe To extend validity of access token
 * @param {string} role Authorization type of token
 * @returns {Promise}
 */
exports.generateJwt = async (
  payload,
  type = "ACCESS_TOKEN",
  rememberMe = false,
  role = "USER"
) => {
  // checking params input
  if (
    !config.JWT.VALID_TOKENS.includes(type) ||
    !config.JWT.ROLES.includes(role)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, INVALID_TOKEN_TYPE_OR_ROLE);
  }

  // adding token preferences

  payload.type = type;

  payload.rememberMe = rememberMe;

  payload.role = role;

  // ecrypting the payload to prevent viewing data inside of it.
  const securedToken = generateSecureToken(payload);

  // creating the jwt using decrpted payload
  const jwtToken = jwt.sign(
    { identifier: securedToken },
    config.JWT.PRIVATE_KEY,
    {
      expiresIn:
        type === "REFRESH_TOKEN" || rememberMe
          ? `${config.JWT.EXPIRES_IN.REFRESH_TOKEN}s`
          : `${config.JWT.EXPIRES_IN[type]}s`,
      algorithm: config.JWT.ALGORITHM,
    }
  );

  // eslint-disable-next-line no-constant-condition
  if (type === "EMAIL_VERIFICATION_TOKEN" || "PASSWORD_RESET_TOKEN") {
    // Using user's unique identification, by this if user requests multiple email verification
    // or password reset email, then only most recent will work, and all previous emails will
    // not work, this is a good security practice
    await redis.setEx(
      `${type}_${payload.sub}`,
      config.JWT.EXPIRES_IN[type],
      securedToken
    );
  }
  if (type === "ACCESS_TOKEN") {
    const extendableTime = rememberMe
      ? config.JWT.EXPIRES_IN.REFRESH_TOKEN
      : config.JWT.EXPIRES_IN.ACCESS_TOKEN;
    await Promise.all([
      // updating the token access time
      // Needed to check when was token last time accessed
      redis.setEx(securedToken, extendableTime, moment().unix()),
      // maintaining user login list and adding secured token into it
      redis.pushIntoList(payload.sub.toString(), securedToken),
      // setting or updating the expiration time of user login list
      redis.setExpirationOnKey(payload.sub.toString(), extendableTime),
    ]);
  }

  return { jwtToken, securedToken };
};

/**
 *
 * @param {string} jwtToken
 * @returns {Promise}
 */
exports.verifyJwt = (jwtToken) => {
  try {
    const verifiedJwt = jwt.verify(jwtToken, config.JWT.PUBLIC_KEY);

    const securedToken = verifiedJwt.payload.identifier;
    const data = verifySecureToken(securedToken);

    // cheecking if token type is valid or not
    if (
      !config.JWT.VALID_TOKENS.includes(data.type) ||
      !config.JWT.ROLES.includes(data.role)
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_TOKEN_TYPE_OR_ROLE);
    }

    return { identifier: securedToken, data };
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, JWT_TOKEN_EXPIRED);
  }
};

/**
 *
 * @param {string} payload Verified and decoded jwt token
 * @param {function} callback Returns callback
 * @returns {function} Returns callback
 */
exports.verifyJwtCallback = async (payload, callback) => {
  try {
    // here we recieved payload after verifying jwt,
    // decrypting the data, as we encrypted when genearating jwt token
    const data = verifySecureToken(payload.identifier);

    // fetching user's active login list
    const activeLogins = await redis.getList(data.sub);

    // checking whether user token identifier exists in user login list or not
    // And we only allow access tokens to authenticate
    if (
      data.type !== "ACCESS_TOKEN" ||
      !activeLogins.includes(payload.identifier)
    ) {
      // we can add rate limiter if needed for malicious user
      return callback(null, false);
    }

    // check user login compulsion to force user for re-authenticate from certain time of login
    // if data.iat > 3 months then call expireJwt and ask use to re-login

    // Updating token accessed time and setting it for max 30 days
    // as identifier is valid only max for 30 days

    await redis.set(payload.identifier, moment().unix());

    // Optional for more security, strict to original remote host machine only for which jwt is generated:
    /**
     * We can modify below code as we want
     * You must pass the remote/host mac address in payload and
     * must attach in req object
     * if(data.macAddress !== req.macAddress)
     * {
     *  console.log("You are not authorized...mac is different for which jwt is generated");
     *  return callback(null, false);
     * }
     */

    // attaching the identifier to data, needed at expireJwt to terminate active jwt logins from redis cache
    // in case of mupltiple logins
    data.identifier = payload.identifier;

    return callback(null, data);
  } catch (err) {
    return callback(err, false);
  }
};

/**
 *
 * @param {string} sub Unique user id
 * @param {string} accessToken Jwt access token
 * @param {string} identifier Identifier to remove from cache in case of mupltiple logins
 * default is false indicates that there is no multiple logins system implemented
 * @returns
 */
exports.expireJwt = async (sub, identifier, accessToken) => {
  await Promise.all([
    redis.deleteKey(identifier),
    redis.removeFromList(sub, identifier),
    jwtTokens.deleteOne({
      accessToken,
    }),
  ]);
};

/**
 *
 * @param {string} accessToken Expired/Active jwt access token that belongs to same refresh token
 * @param {string} refreshToken Valid jwt refresh token
 * @returns {Promise} new jwt access and refresh token
 */

exports.regenerateJwt = async (accessToken, refreshToken) => {
  try {
    // verifying refresh token first
    this.verifyJwt(refreshToken);

    const token = await jwtTokens.findOne({
      accessToken,
    });

    // checking if access & refresh token are same pair or not
    if (!token || token.refreshToken !== refreshToken) {
      // use your own error creater and handler
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        INVALID_ACCESS_OR_REFRESH_TOKEN
      );
    }

    await this.expireJwt(token.sub.toString(), token.identifier, accessToken);

    // Dcrypting the identifier
    const payload = verifySecureToken(token.identifier);

    // getting token preferences
    const { role, rememberMe } = payload;

    // Now generating new access token and refresh token using the original data/payload
    const jwts = await Promise.all([
      this.generateJwt(payload, "ACCESS_TOKEN", rememberMe, role),
      this.generateJwt(payload, "REFRESH_TOKEN", false, role),
    ]);
    const accesstoken = jwts[0].jwtToken;
    const refreshtoken = jwts[1].jwtToken;
    await jwtTokens.create({
      sub: token.sub,
      identifier: jwts[0].securedToken,
      accessToken: accesstoken,
      refreshToken: refreshtoken,
    });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, JWT_TOKEN_EXPIRED);
  }
};
