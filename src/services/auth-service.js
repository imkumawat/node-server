const httpStatus = require("http-status");
const { verifyJwt } = require("./jwt-service");
const redis = require("../utils/redis-client");
const ApiError = require("../utils/api-error");
const { VERIFICATION_LINK_EXPIRED } = require("../constants/error-constants");

// we can verify token for email address verification or password reset email
// this will return the user id for which token is generated and verified
exports.verifyAccount = async (token, verificationType) => {
  try {
    const tokenData = await verifyJwt(token);
    const { sub } = tokenData.data;
    const key = `${verificationType}_${sub}`;
    const identifier = await redis.getKey(key);
    if (identifier && identifier === tokenData.identifier) {
      await redis.deleteKey(key);
      return sub;
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, VERIFICATION_LINK_EXPIRED);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, VERIFICATION_LINK_EXPIRED);
  }
};
