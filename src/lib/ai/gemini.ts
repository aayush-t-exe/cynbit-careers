import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | undefined;

export function aiAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export const geminiModel = () => process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

// Ask for JSON that matches `schema`, with a hard timeout so a slow model never
// blocks a candidate. Callers always have a rule-based fallback for a null result.
export async function generateJson<T>(options: {
  system: string;
  parts: Part[];
  schema: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<T | null> {
  if (!aiAvailable()) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const response = await client.models.generateContent({
      model: geminiModel(),
      contents: [{ role: "user", parts: options.parts }],
      config: {
        systemInstruction: options.system,
        responseMimeType: "application/json",
        responseJsonSchema: options.schema,
        temperature: 0,
        abortSignal: controller.signal,
      },
    });
    return response.text ? (JSON.parse(response.text) as T) : null;
  } catch (error) {
    console.warn("[gemini] falling back to rules:", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
