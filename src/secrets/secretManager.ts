import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretClient = new SecretManagerServiceClient();

export async function readSecretVersion(secretVersionName: string): Promise<string> {
  const [version] = await secretClient.accessSecretVersion({
    name: secretVersionName
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Secret payload is empty for ${secretVersionName}`);
  }

  return payload;
}
