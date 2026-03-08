import dotenv from "dotenv";

dotenv.config({ override: true });

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type RuntimeConfig = {
  logLevel: "debug" | "info" | "warn" | "error";
  promptFilePath: string;
  port: number;
  gcpProjectId: string;
  gcpLocation: string;
  geminiModel: string;
  discordApplicationId: string;
  discordBotToken: string | null;
  discordBotTokenSecret: string | null;
  gcpServiceAccountJson: string | null;
  gcpServiceAccountJsonSecret: string | null;
};

function getLogLevel(value: string | undefined): RuntimeConfig["logLevel"] {
  const parsed = (value ?? "info").toLowerCase();
  if (parsed === "debug" || parsed === "info" || parsed === "warn" || parsed === "error") {
    return parsed;
  }
  return "info";
}

export function loadConfig(): RuntimeConfig {
  const parsedPort = Number.parseInt(readEnv("PORT") ?? "8080", 10);
  const safePort = Number.isFinite(parsedPort) ? parsedPort : 8080;

  const projectId = readEnv("GCP_PROJECT_ID") ?? "";
  const location = readEnv("GCP_LOCATION") ?? "us-central1";
  const geminiModel = readEnv("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const applicationId = readEnv("DISCORD_APPLICATION_ID") ?? "";

  return {
    logLevel: getLogLevel(readEnv("LOG_LEVEL")),
    promptFilePath: readEnv("PROMPT_FILE_PATH") ?? "prompts/system/alt-character-coach.txt",
    port: safePort,
    gcpProjectId: projectId,
    gcpLocation: location,
    geminiModel,
    discordApplicationId: applicationId,
    discordBotToken: readEnv("DISCORD_BOT_TOKEN") ?? null,
    discordBotTokenSecret: readEnv("DISCORD_BOT_TOKEN_SECRET") ?? null,
    gcpServiceAccountJson: readEnv("GCP_SERVICE_ACCOUNT_JSON") ?? null,
    gcpServiceAccountJsonSecret: readEnv("GCP_SERVICE_ACCOUNT_JSON_SECRET") ?? null
  };
}
