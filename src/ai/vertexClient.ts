import { VertexAI } from "@google-cloud/vertexai";
import type { RuntimeConfig } from "../config.js";

type GenerateReplyInput = {
  systemPrompt: string;
  userMessage: string;
};

type VertexClientOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  serviceAccountJson?: string | null;
};

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1200;

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRetryableError(error: unknown): boolean {
  const message = toMessage(error).toLowerCase();
  return (
    message.includes("deadline") ||
    message.includes("timeout") ||
    message.includes("temporarily") ||
    message.includes("unavailable") ||
    message.includes("resource exhausted") ||
    message.includes("429") ||
    message.includes("500") ||
    message.includes("503")
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Vertex request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class VertexClient {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly vertexAI: VertexAI;

  constructor(config: RuntimeConfig, options?: VertexClientOptions) {
    if (!config.gcpProjectId) {
      throw new Error("Missing GCP_PROJECT_ID for Vertex AI runtime.");
    }

    this.model = config.geminiModel;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;

    const serviceAccountJson = options?.serviceAccountJson?.trim();
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson) as object;
      this.vertexAI = new VertexAI({
        project: config.gcpProjectId,
        location: config.gcpLocation,
        googleAuthOptions: {
          credentials,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"]
        }
      });
      return;
    }

    this.vertexAI = new VertexAI({
      project: config.gcpProjectId,
      location: config.gcpLocation
    });
  }

  async generateReply(input: GenerateReplyInput): Promise<string> {
    const generativeModel = this.vertexAI.getGenerativeModel({
      model: this.model,
      systemInstruction: {
        role: "system",
        parts: [{ text: input.systemPrompt }]
      }
    });

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      try {
        const result = await withTimeout(
          generativeModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [{ text: input.userMessage }]
              }
            ]
          }),
          this.timeoutMs
        );

        const responseText = result.response.candidates
          ?.flatMap((candidate) => candidate.content?.parts ?? [])
          .map((part) => part.text ?? "")
          .join("\n")
          .trim();

        if (!responseText) {
          throw new Error("Vertex returned an empty response.");
        }

        return responseText;
      } catch (error: unknown) {
        lastError = error;

        if (attempt >= this.maxRetries || !isRetryableError(error)) {
          break;
        }

        const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delayMs);
      }

      attempt += 1;
    }

    throw new Error(`Vertex generation failed after ${attempt + 1} attempt(s): ${toMessage(lastError)}`);
  }
}
