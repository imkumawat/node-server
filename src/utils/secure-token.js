const crypto = require("crypto");
const config = require("config");
const moment = require("moment");

/**
 *
 * @param {object} data Object that needs to be encrypted
 * @returns {string} Encrypted string
 */
exports.generateSecureToken = (data) => {
  // we assume that data is type of object

  // adding some random salt in the data to make generated token unique
  // for everytime and even unique for same data/payload
  // eslint-disable-next-line no-param-reassign
  data._ = moment().unix();

  // stringifying data.
  // so use JSON.parse after decrypting the secured token
  const payload = JSON.stringify(data);

  const cipher = crypto.createCipheriv(
    config.CRYPTO.ALGORITHM,
    Buffer.from(config.CRYPTO.SECURITY_KEY, "hex"),
    Buffer.from(config.CRYPTO.INIT_VECTOR, "hex")
  );

  let securedToken = cipher.update(payload, "utf-8", "hex");
  securedToken += cipher.final("hex");

  return securedToken;
};

/**
 *
 * @param {string} securedToken Encrypted string
 * @returns {object} Decrypted object
 */
exports.verifySecureToken = (securedToken) => {
  const decipher = crypto.createDecipheriv(
    config.CRYPTO.ALGORITHM,
    Buffer.from(config.CRYPTO.SECURITY_KEY, "hex"),
    Buffer.from(config.CRYPTO.INIT_VECTOR, "hex")
  );

  let verifiedToken = decipher.update(securedToken, "hex", "utf-8");
  verifiedToken += decipher.final("utf8");

  // parsing the stringfied data
  const data = JSON.parse(verifiedToken);

  // removing the added salt
  delete data._;
  return data;
};

/**
 *
 * @param {number} size Specify the size of random token, default is 32
 * @returns {string} Random stringified token
 */
exports.generateRandomToken = (size = 32) => {
  const token = crypto.randomBytes(size).toString("hex");

  return token;
};
