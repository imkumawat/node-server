const { createClient } = require("redis");
const config = require("config");

let redis = "";

exports.redisClient = async () => {
  try {
    redis = createClient({
      socket: {
        host: config.REDIS_CONFIG.REDIS_HOST,
        port: config.REDIS_CONFIG.REDIS_PORT,
      },
    });
    await redis.connect();

    return Promise.resolve("Connected to Redis");
  } catch (err) {
    return Promise.reject(err);
  }
};

/**
 *
 * @param {string} key
 * @param {number} expr
 * @param {any} value
 * @returns {string} status
 */
exports.setEx = async (key, expr, value) => {
  try {
    return redis.setEx(key, expr, value);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} key
 * @returns {string} value
 */
exports.get = async (key) => {
  try {
    return redis.get(key);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} key
 * @returns {string} status
 */
exports.delete = async (key) => {
  try {
    return redis.DEL(key);
  } catch (error) {
    throw new Error(error.message);
  }
};
