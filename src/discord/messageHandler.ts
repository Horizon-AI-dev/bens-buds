import type { Client, Message } from "discord.js";
import type { ConversationMemory, ConversationTurn } from "../memory/conversationMemory.js";

export type ReplyGenerator = (input: {
  systemPrompt: string;
  userMessage: string;
}) => Promise<string>;

const FALLBACK_REPLY =
  "I hit a temporary issue generating a response. Please try again in a few seconds.";

const BEN_DISCORD_ID = "jelly309";

function isBenCaller(message: Message<boolean>): boolean {
  const { author } = message;
  const normalizedId = author.id.toLowerCase();
  const normalizedUsername = author.username.toLowerCase();
  const normalizedGlobalName = author.globalName?.toLowerCase();

  // Some teams refer to username/handle as "Discord ID", so match all common identifiers.
  return (
    normalizedId === BEN_DISCORD_ID ||
    normalizedUsername === BEN_DISCORD_ID ||
    normalizedGlobalName === BEN_DISCORD_ID
  );
}

function formatConversationContext(turns: ConversationTurn[], userMessage: string): string {
  if (turns.length === 0) {
    return userMessage;
  }

  const history = turns
    .map(
      (turn, index) =>
        `Turn ${index + 1} - User: ${turn.userMessage}\nTurn ${index + 1} - Assistant: ${turn.assistantReply}`
    )
    .join("\n\n");

  return [
    "Recent conversation context (oldest to newest):",
    history,
    `Latest user message: ${userMessage}`,
    "Reply to the latest user message while using context when relevant."
  ].join("\n\n");
}

function formatReplyPromptForCaller(turns: ConversationTurn[], userMessage: string, isBen: boolean): string {
  const baseContext = formatConversationContext(turns, userMessage);

  if (!isBen) {
    return baseContext;
  }

  return [
    "Caller identity: This message is from Ben (Discord ID jelly309).",
    "Reply directly to Ben and address him by name when natural.",
    baseContext
  ].join("\n\n");
}

export async function handleMentionMessage(
  message: Message<boolean>,
  client: Client<true>,
  systemPrompt: string,
  replyGenerator: ReplyGenerator,
  conversationMemory: ConversationMemory
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!message.mentions.has(client.user)) {
    return;
  }

  const mentionPattern = new RegExp(`<@!?${client.user.id}>`, "g");
  const strippedContent = message.content.replace(mentionPattern, "").trim();
  const callerIsBen = isBenCaller(message);

  try {
    const userMessage =
      strippedContent || "User mentioned the bot without additional text. Ask a concise clarifying question.";
    const recentTurns = conversationMemory.getRecentTurns(message.channelId);
    const promptUserMessage = formatReplyPromptForCaller(recentTurns, userMessage, callerIsBen);
    const reply = await replyGenerator({
      systemPrompt,
      userMessage: promptUserMessage
    });
    const finalReply = callerIsBen ? `<@${message.author.id}> ${reply}` : reply;
    await message.reply(finalReply);
    conversationMemory.addTurn(message.channelId, userMessage, reply);
  } catch (error) {
    console.error("[error] Failed to generate reply", error);
    await message.reply(FALLBACK_REPLY);
  }
}
