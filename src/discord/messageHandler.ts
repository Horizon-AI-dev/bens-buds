import type { Client, Message } from "discord.js";

export type ReplyGenerator = (input: {
  systemPrompt: string;
  userMessage: string;
}) => Promise<string>;

const FALLBACK_REPLY =
  "I hit a temporary issue generating a response. Please try again in a few seconds.";

export async function handleMentionMessage(
  message: Message<boolean>,
  client: Client<true>,
  systemPrompt: string,
  replyGenerator: ReplyGenerator
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!message.mentions.has(client.user)) {
    return;
  }

  const mentionPattern = new RegExp(`<@!?${client.user.id}>`, "g");
  const strippedContent = message.content.replace(mentionPattern, "").trim();

  try {
    const userMessage =
      strippedContent || "User mentioned the bot without additional text. Ask a concise clarifying question.";
    const reply = await replyGenerator({
      systemPrompt,
      userMessage
    });
    await message.reply(reply);
  } catch (error) {
    console.error("[error] Failed to generate reply", error);
    await message.reply(FALLBACK_REPLY);
  }
}
