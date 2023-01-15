const config = require("config");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  region: config.REGION ? config.REGION : "us-east-1",
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
