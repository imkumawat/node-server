const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  region: process.env.REGION ? process.env.REGION : "us-east-1",
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
