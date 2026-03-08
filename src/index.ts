import { Client, Events, GatewayIntentBits, type Message } from "discord.js";
import { loadConfig } from "./config.js";
import { handleMentionMessage } from "./discord/messageHandler.js";
import { loadSystemPrompt } from "./prompts/promptLoader.js";
import { readSecretVersion } from "./secrets/secretManager.js";

const config = loadConfig();
const systemPrompt = loadSystemPrompt(config.promptFilePath);

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
    await handleMentionMessage(message, client as Client<true>, systemPrompt);
  } catch (error) {
    console.error("[error] Failed to process message", error);
  }
});

const token = await resolveDiscordToken();

client.login(token).catch((error: unknown) => {
  console.error("[error] Failed to login to Discord", error);
  process.exit(1);
});
