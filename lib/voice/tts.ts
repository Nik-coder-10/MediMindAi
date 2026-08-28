export interface TTSOptions {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | string;
  speed?: number;
  language?: string;
}

export interface VoiceTTSService {
  synthesizeSpeech(text: string, options?: TTSOptions): Promise<ArrayBuffer>;
}

export class StandardTTSService implements VoiceTTSService {
  async synthesizeSpeech(text: string, options?: TTSOptions): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }
}

export const ttsService = new StandardTTSService();

/**
 * Client-side speech synthesis helper prioritizing natural Indian-sounding voices
 * (e.g. Google हिन्दी, Google English (India), Microsoft Neerja/Prabhat/Swara/Hemant)
 * at a calm medical speaking rate (0.9x).
 */
export function speakWithIndianVoice(
  text: string,
  lang: "hi" | "en",
  onEnd?: () => void,
  onError?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.90; // Calm, clear, medical pace
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();

  if (lang === "hi") {
    // Look for best natural Hindi Indian voice
    const hindiVoice = voices.find(
      (v) =>
        v.lang === "hi-IN" ||
        v.lang.startsWith("hi") ||
        v.name.toLowerCase().includes("hindi") ||
        v.name.toLowerCase().includes("swara") ||
        v.name.toLowerCase().includes("madhur")
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
  } else {
    // Look for natural Indian English voice first, avoiding generic en-US
    const indianEnglishVoice = voices.find(
      (v) =>
        v.lang === "en-IN" ||
        v.name.toLowerCase().includes("india") ||
        v.name.toLowerCase().includes("neerja") ||
        v.name.toLowerCase().includes("prabhat") ||
        v.name.toLowerCase().includes("heera") ||
        v.name.toLowerCase().includes("ravi")
    );
    if (indianEnglishVoice) {
      utterance.voice = indianEnglishVoice;
    }
  }

  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return true;
}

