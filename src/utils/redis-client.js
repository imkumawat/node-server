const { createClient } = require("redis");
const config = require("config");

let redis = "";

exports.redisClient = async () => {
  try {
    redis = createClient({
      socket: {
        host: config.REDIS.HOST,
        port: config.REDIS.PORT,
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
 * @param {string | number} value
 * @returns {Promise}
 */
exports.setEx = (key, expr, value) => {
  try {
    return redis.setEx(key, expr, value);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} key
 * @param {string | number} value
 * @returns {Promise}
 */
exports.set = (key, value) => {
  try {
    return redis.set(key, value);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} key
 * @returns {Promise}
 */
exports.getKey = (key) => {
  try {
    return redis.get(key);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} key
 * @returns {Promise}
 */
exports.deleteKey = (key) => {
  try {
    return redis.DEL(key);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} listName
 * @param {string | number} value
 * @returns {Promise}
 */
exports.pushIntoList = (listName, value) => {
  try {
    return redis.LPUSH(listName, value);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} listName
 * @param {string | number} value
 * @param {number} occurance
 * @returns {Promise}
 */
exports.removeFromList = (listName, value, occurance = 1) => {
  try {
    return redis.LREM(listName, occurance, value);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} listName
 * @param {number} startFrom
 * @param {number} endAt
 * @returns {Promise}
 */
exports.getList = (listName, startFrom = 0, endAt = -1) => {
  try {
    return redis.LRANGE(listName, startFrom, endAt);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 *
 * @param {string} listName
 * @param {number} expirationTimeInSeconds
 * @returns {Promise}
 */
exports.setExpirationOnKey = (listName, expirationTimeInSeconds) => {
  try {
    return redis.expire(listName, expirationTimeInSeconds);
  } catch (error) {
    throw new Error(error.message);
  }
};
