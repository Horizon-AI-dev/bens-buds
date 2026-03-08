import type { Client, Message } from "discord.js";
import type { ConversationMemory, ConversationTurn } from "../memory/conversationMemory.js";

export type ReplyGenerator = (input: {
  systemPrompt: string;
  userMessage: string;
}) => Promise<string>;

const FALLBACK_REPLY =
  "I hit a temporary issue generating a response. Please try again in a few seconds.";

const DISCORD_MESSAGE_MAX_LENGTH = 2000;

const BEN_DISCORD_ID = "jelly309";

const ALT_CLASS_TOPIC_PATTERNS: RegExp[] = [
  /\bben\b.*\balt\b/i,
  /\balt\b.*\bben\b/i,
  /\balt\s*(class|choice|build|spec|character)\b/i,
  /\boff\s*spec\b/i,
  /\bmain\s*(vs|or)\s*alt\b/i,
  /\bclass\s*(swap|switch|choice)\b/i,
  /\bshould\s+i\s+play\b/i,
  /\bwhat\s+alt\s+should\s+i\s+play\b/i,
  /\btoon\b/i
];

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
    "Now that you are speaking to Ben your tone becomes super excited and you really want to discuss his alt choice very enthusiastically!",
    baseContext
  ].join("\n\n");
}

function splitDiscordMessage(content: string, maxLength = DISCORD_MESSAGE_MAX_LENGTH): string[] {
  if (content.length <= maxLength) {
    return [content];
  }

  const chunks: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    const candidate = remaining.slice(0, maxLength);
    const splitAt =
      candidate.lastIndexOf("\n\n") >= Math.floor(maxLength * 0.4)
        ? candidate.lastIndexOf("\n\n")
        : candidate.lastIndexOf(" ");

    const cutIndex = splitAt > 0 ? splitAt : maxLength;
    const nextChunk = remaining.slice(0, cutIndex).trim();

    if (nextChunk.length === 0) {
      chunks.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength).trimStart();
      continue;
    }

    chunks.push(nextChunk);
    remaining = remaining.slice(cutIndex).trimStart();
  }

  return chunks;
}

function isLikelyAltClassTopic(content: string): boolean {
  const normalizedContent = content.trim();
  if (normalizedContent.length === 0) {
    return false;
  }

  return ALT_CLASS_TOPIC_PATTERNS.some((pattern) => pattern.test(normalizedContent));
}

function shouldReplyToMessage(message: Message<boolean>, client: Client<true>): boolean {
  if (message.mentions.has(client.user)) {
    return true;
  }

  if (message.mentions.repliedUser?.id === client.user.id) {
    return true;
  }

  return isLikelyAltClassTopic(message.content);
}

export async function handleIncomingMessage(
  message: Message<boolean>,
  client: Client<true>,
  systemPrompt: string,
  replyGenerator: ReplyGenerator,
  conversationMemory: ConversationMemory
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!shouldReplyToMessage(message, client)) {
    return;
  }

  const mentionPattern = new RegExp(`<@!?${client.user.id}>`, "g");
  const strippedContent = message.content.replace(mentionPattern, "").trim();
  const callerIsBen = isBenCaller(message);

  try {
    const userMessage =
      strippedContent || "User triggered the bot without additional text. Ask a concise clarifying question.";
    const recentTurns = conversationMemory.getRecentTurns(message.channelId);
    const promptUserMessage = formatReplyPromptForCaller(recentTurns, userMessage, callerIsBen);
    const reply = await replyGenerator({
      systemPrompt,
      userMessage: promptUserMessage
    });
    const finalReply = callerIsBen ? `<@${message.author.id}> ${reply}` : reply;
    const replyChunks = splitDiscordMessage(finalReply);

    for (const chunk of replyChunks) {
      await message.reply(chunk);
    }

    conversationMemory.addTurn(message.channelId, userMessage, reply);
  } catch (error) {
    console.error("[error] Failed to generate reply", error);
    await message.reply(FALLBACK_REPLY);
  }
}
