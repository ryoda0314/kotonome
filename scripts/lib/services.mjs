// Gemini TTS on Vertex AI (ことのあめ's project and service account, as ことのおと's scripts) and OpenAI speech-to-text,
// both only to make and check the clips; the app never calls them.
import { GoogleGenAI } from "@google/genai";
import OpenAI, { toFile } from "openai";
import { pcm16ToWav } from "./wav.mjs";

// 2.5 Flash: neither ことのあめ's live voice (2.5 Pro) nor ことのは's live replies (3.1 Flash) draw on its quota.
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";

let gemini = null;
function vertex() {
  if (gemini) return gemini;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY がありません（ことのおと の .env.local を --env-file で）");
  let credentials;
  try {
    credentials = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    credentials = JSON.parse(raw.replace(/\\n/g, "\n"));
  }
  gemini = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    googleAuthOptions: { credentials },
  });
  return gemini;
}

/** One generation as a WAV buffer (Gemini returns raw 16-bit PCM; the rate is read from its mime type). */
export async function synthesize(prompt, voice, model = TTS_MODEL) {
  const r = await vertex().models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: { languageCode: "ko-KR", voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const part = r.candidates?.[0]?.content?.parts?.find((x) => x.inlineData?.data);
  if (!part) throw new Error("no audio");
  const mime = part.inlineData.mimeType ?? "";
  const bytes = Buffer.from(part.inlineData.data, "base64");
  if (!/pcm|l16/i.test(mime)) throw new Error(`unexpected audio type ${mime}`);
  const rate = Number(mime.match(/rate=(\d+)/i)?.[1]) || 24000;
  return pcm16ToWav(bytes, rate);
}

let openai = null;
/**
 * What a recognizer hears in a WAV, as text. The prompt says only that it is one Korean word, never which; with
 * `choices` it says it is one of these (a recognizer leans toward the commoner of two near words, and naming them
 * takes the lean away).
 */
export async function transcribe(wav, choices = null, model = "gpt-4o-transcribe") {
  openai ??= new OpenAI();
  const prompt = choices
    ? `다음은 한국어 단어 하나입니다. ${choices.map((c) => `「${c}」`).join(" 또는 ")} 중 하나입니다.`
    : "다음은 한국어 단어 하나입니다.";
  const r = await openai.audio.transcriptions.create({
    file: await toFile(wav, "clip.wav", { type: "audio/wav" }),
    model,
    language: "ko",
    prompt,
  });
  return r.text.trim();
}

/** Retries rate limits (Vertex TTS quota is per minute) and dropped connections; anything else is thrown. */
export async function withRetry(fn, { rateWaitMs = 10_000, offlineWaitMs = 30_000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // The SDKs wrap a dropped connection ("Connection error.") around the real cause (fetch failed, ENOTFOUND).
      const msg = [err?.message, err?.cause?.message, err?.cause?.cause?.code, err?.code].filter(Boolean).join(" ") || String(err);
      if (/RESOURCE_EXHAUSTED|429/.test(msg) && attempt < 40) {
        await new Promise((r) => setTimeout(r, rateWaitMs));
        continue;
      }
      if (/Connection error|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|503|502|500|UNAVAILABLE|INTERNAL/i.test(msg) && attempt < 20) {
        await new Promise((r) => setTimeout(r, offlineWaitMs));
        continue;
      }
      throw err;
    }
  }
}
