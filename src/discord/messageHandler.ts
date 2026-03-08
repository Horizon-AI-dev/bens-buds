import type { Client, Message } from "discord.js";

function buildPromptDrivenReply(content: string, systemPrompt: string): string {
  if (!content) {
    return [
      "I can help Ben choose an alt character.",
      "Tell me preferred role, complexity, and group utility priorities.",
      `Prompt baseline: ${systemPrompt.split("\n")[0]}`
    ].join("\n");
  }

  return [
    "Ben's Buds focus: choosing Ben's alt character.",
    `Input: ${content}`,
    "Next step: share preferred role (DPS/Tank/Support), difficulty, and solo vs group focus.",
    `Prompt baseline: ${systemPrompt.split("\n")[0]}`
  ].join("\n");
}

export async function handleMentionMessage(
  message: Message<boolean>,
  client: Client<true>,
  systemPrompt: string
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!message.mentions.has(client.user)) {
    return;
  }

  const mentionPattern = new RegExp(`<@!?${client.user.id}>`, "g");
  const strippedContent = message.content.replace(mentionPattern, "").trim();
  await message.reply(buildPromptDrivenReply(strippedContent, systemPrompt));
}
