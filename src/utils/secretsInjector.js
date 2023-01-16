// const config = require("config");
// const { getSecret } = require("./secretsManager");

/**
 * @returns promise
 */
exports.secretsInjector = async () => {
  try {
    // Fetching DB Connection String
    // const databaseSecrets = JSON.parse(
    //   await getSecret(config.DB_CONNECTION_STRING)
    // );
    // const connectionString = `mongodb+srv://${databaseSecrets.username}:${databaseSecrets.password}@${databaseSecrets.host}/${databaseSecrets.database}?retryWrites=true&w=majority`;
    // config.DB_CONNECTION_STRING = connectionString;

    return Promise.resolve("Injected Secrets into process");
  } catch (err) {
    return Promise.reject(err);
  }
};
