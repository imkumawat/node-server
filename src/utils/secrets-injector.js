const config = require("config");
//  const getSecret  = require("./secrets-manager");

/**
 * @desc Injecting all needed secrets into config
 * @returns promise
 */
module.exports = async () => {
  try {
    // Injecting AWS Credentials into the process if present in current config
    // Otherwise AWS Secret Manager will use default credential providers
    // This is needed if running application in local environmnet

    if (config.AWS.ACCESS_KEY_ID && config.AWS.SECRET_ACCESS_KEY) {
      process.env.AWS_ACCESS_KEY_ID = config.AWS.ACCESS_KEY_ID;
      process.env.AWS_SECRET_ACCESS_KEY = config.AWS.SECRET_ACCESS_KEY;
    }

    // Fetching DB Connection String
    // const databaseSecrets = JSON.parse(await getSecret(config.DB_SECRETS));
    //  const connectionString = `mongodb+srv://${databaseSecrets.username}:${databaseSecrets.password}@${databaseSecrets.host}/${databaseSecrets.database}?retryWrites=true&w=majority`;
    //  config.DB_CONNECTION_STRING = connectionString;
    // console.log(connectionString);

    // Fetching Redis config

    // const redisSecrets = JSON.parse(await getSecret(config.REDIS_SECRETS));
    // const redisConfig = {
    //   REDIS_HOST: redisSecrets.host,
    //   REDIS_PORT: redisSecrets.port,
    // };
    // config.REDIS_CONFIG = redisConfig;
    // console.log(config.REDIS_CONFIG);
    return Promise.resolve("Injected Secrets into process");
  } catch (err) {
    return Promise.reject(err);
  }
};
