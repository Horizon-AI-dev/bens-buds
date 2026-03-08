import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadSystemPrompt(promptPath: string): string {
  const absolutePath = resolve(promptPath);
  const raw = readFileSync(absolutePath, "utf8");
  const normalized = raw.trim();

  if (!normalized) {
    throw new Error(`System prompt file is empty: ${absolutePath}`);
  }

  return normalized;
}
