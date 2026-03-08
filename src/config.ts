import dotenv from "dotenv";

dotenv.config();

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
};

function getLogLevel(value: string | undefined): RuntimeConfig["logLevel"] {
  const parsed = (value ?? "info").toLowerCase();
  if (parsed === "debug" || parsed === "info" || parsed === "warn" || parsed === "error") {
    return parsed;
  }
  return "info";
}

export function loadConfig(): RuntimeConfig {
  const parsedPort = Number.parseInt(process.env.PORT ?? "8080", 10);
  const safePort = Number.isFinite(parsedPort) ? parsedPort : 8080;

  const projectId = process.env.GCP_PROJECT_ID ?? "";
  const location = process.env.GCP_LOCATION ?? "us-central1";
  const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.0-flash";
  const applicationId = process.env.DISCORD_APPLICATION_ID ?? "";

  return {
    logLevel: getLogLevel(process.env.LOG_LEVEL),
    promptFilePath: process.env.PROMPT_FILE_PATH ?? "prompts/system/alt-character-coach.txt",
    port: safePort,
    gcpProjectId: projectId,
    gcpLocation: location,
    geminiModel,
    discordApplicationId: applicationId,
    discordBotToken: process.env.DISCORD_BOT_TOKEN ?? null,
    discordBotTokenSecret: process.env.DISCORD_BOT_TOKEN_SECRET ?? null
  };
}
