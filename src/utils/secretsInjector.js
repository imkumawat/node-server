const { getSecret } = require("./secretsManager");

/**
 *
 * @returns promise
 */
exports.secretsInjector = async () => {
  try {
    // Fetching DB Connection String
    process.env.DB_CONNECTION_STRING = await getSecret(
      process.env.DB_CONNECTION_STRING
    );

    return Promise.resolve("Injected Secrets into process");
  } catch (err) {
    return Promise.reject(err);
  }
};
