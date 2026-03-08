export type ConversationTurn = {
  userMessage: string;
  assistantReply: string;
};

export class ConversationMemory {
  private readonly maxTurns: number;
  private readonly turnsByThread = new Map<string, ConversationTurn[]>();

  constructor(maxTurns: number) {
    if (!Number.isInteger(maxTurns) || maxTurns <= 0) {
      throw new Error("Conversation memory size must be a positive integer.");
    }

    this.maxTurns = maxTurns;
  }

  getRecentTurns(threadId: string): ConversationTurn[] {
    return [...(this.turnsByThread.get(threadId) ?? [])];
  }

  addTurn(threadId: string, userMessage: string, assistantReply: string): void {
    const turns = this.turnsByThread.get(threadId) ?? [];
    turns.push({ userMessage, assistantReply });

    while (turns.length > this.maxTurns) {
      turns.shift();
    }

    this.turnsByThread.set(threadId, turns);
  }
}
