const config = require("config");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  // This is for the informational only, We must use these credentials from default providers
  // credentials: {
  //   accessKeyId: config.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  // },
  region: config.AWS_REGION ? config.AWS_REGION : "us-east-1",
});

exports.getSecret = async (secretName) => {
  try {
    const params = {
      SecretId: secretName,
    };
    const command = new GetSecretValueCommand(params);
    const secret = await client.send(command);
    const secretValue = secret.SecretString;
    return Promise.resolve(secretValue);
  } catch (err) {
    return Promise.reject(err);
  }
};
