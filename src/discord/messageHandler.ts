import type { Client, Message } from "discord.js";
import type { ConversationMemory, ConversationTurn } from "../memory/conversationMemory.js";

export type ReplyGenerator = (input: {
  systemPrompt: string;
  userMessage: string;
}) => Promise<string>;

const FALLBACK_REPLY =
  "I hit a temporary issue generating a response. Please try again in a few seconds.";

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

  try {
    const userMessage =
      strippedContent || "User mentioned the bot without additional text. Ask a concise clarifying question.";
    const recentTurns = conversationMemory.getRecentTurns(message.channelId);
    const promptUserMessage = formatConversationContext(recentTurns, userMessage);
    const reply = await replyGenerator({
      systemPrompt,
      userMessage: promptUserMessage
    });
    await message.reply(reply);
    conversationMemory.addTurn(message.channelId, userMessage, reply);
  } catch (error) {
    console.error("[error] Failed to generate reply", error);
    await message.reply(FALLBACK_REPLY);
  }
}
