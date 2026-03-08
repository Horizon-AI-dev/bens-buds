import { Client, Events, GatewayIntentBits, type Message } from "discord.js";
import { VertexClient } from "./ai/vertexClient.js";
import { loadConfig } from "./config.js";
import { handleIncomingMessage } from "./discord/messageHandler.js";
import { ConversationMemory } from "./memory/conversationMemory.js";
import { loadSystemPrompt } from "./prompts/promptLoader.js";
import { startHealthServer } from "./server/health.js";
import { readSecretVersion } from "./secrets/secretManager.js";

const config = loadConfig();
const systemPrompt = loadSystemPrompt(config.promptFilePath);
const conversationMemory = new ConversationMemory(50);

async function resolveVertexServiceAccountJson(): Promise<string | null> {
  if (config.gcpServiceAccountJson) {
    return config.gcpServiceAccountJson;
  }

  if (config.gcpServiceAccountJsonSecret) {
    return readSecretVersion(config.gcpServiceAccountJsonSecret);
  }

  return null;
}

async function resolveDiscordToken(): Promise<string> {
  if (config.discordBotToken) {
    return config.discordBotToken;
  }

  if (!config.discordBotTokenSecret) {
    throw new Error(
      "Missing Discord token source. Set DISCORD_BOT_TOKEN for local use or DISCORD_BOT_TOKEN_SECRET for Secret Manager runtime."
    );
  }

  return readSecretVersion(config.discordBotTokenSecret);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, (readyClient: Client<true>) => {
  console.log(`[info] Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message: Message<boolean>) => {
  try {
    await handleIncomingMessage(message, client as Client<true>, systemPrompt, ({ systemPrompt, userMessage }) =>
      vertexClient.generateReply({
        systemPrompt,
        userMessage
      }),
      conversationMemory
    );
  } catch (error) {
    console.error("[error] Failed to process message", error);
  }
});

const healthServer = startHealthServer(config.port);
const vertexServiceAccountJson = await resolveVertexServiceAccountJson();
const vertexClient = new VertexClient(config, { serviceAccountJson: vertexServiceAccountJson });
const token = await resolveDiscordToken();

client.login(token).catch((error: unknown) => {
  console.error("[error] Failed to login to Discord", error);
  process.exit(1);
});

let shuttingDown = false;
const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`[info] Received ${signal}; shutting down.`);

  try {
    await healthServer.close();
  } catch (error) {
    console.error("[warn] Failed to close health server cleanly", error);
  }

  client.destroy();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
