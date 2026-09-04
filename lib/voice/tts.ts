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

import { toRajasthani } from "./rajasthani";

/**
 * Resolves the best available voice for the given language.
 * Waits up to 500ms for voiceschanged to fire if voices aren't loaded yet.
 */
function getBestVoice(lang: "hi" | "en" | "raj" | string): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    const pick = (vs: SpeechSynthesisVoice[]) => {
      if (lang === "hi" || lang === "raj") {
        return (
          vs.find((v) => v.lang === "hi-IN") ||
          vs.find((v) => v.lang.startsWith("hi")) ||
          vs.find((v) => v.name.toLowerCase().includes("hindi")) ||
          vs.find((v) => v.name.toLowerCase().includes("swara")) ||
          vs.find((v) => v.name.toLowerCase().includes("madhur")) ||
          null
        );
      } else {
        return (
          vs.find((v) => v.lang === "en-IN") ||
          vs.find((v) => v.name.toLowerCase().includes("india")) ||
          vs.find((v) => v.name.toLowerCase().includes("neerja")) ||
          vs.find((v) => v.name.toLowerCase().includes("prabhat")) ||
          vs.find((v) => v.name.toLowerCase().includes("ravi")) ||
          vs.find((v) => v.lang.startsWith("en")) ||
          null
        );
      }
    };

    if (voices.length > 0) {
      resolve(pick(voices));
      return;
    }

    // Voices not yet loaded — wait for voiceschanged
    const timeout = setTimeout(() => {
      synth.removeEventListener("voiceschanged", handler);
      resolve(pick(synth.getVoices()));
    }, 600);

    const handler = () => {
      clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", handler);
      resolve(pick(synth.getVoices()));
    };
    synth.addEventListener("voiceschanged", handler);
  });
}

/**
 * Client-side speech synthesis helper prioritizing natural Indian-sounding voices
 * (e.g. Google हिन्दी, Google English (India), Microsoft Neerja/Prabhat/Swara/Hemant)
 * at a calm medical speaking rate (0.88x).
 * When lang is 'raj', text is converted into native Rajasthani vernacular.
 */
export function speakWithIndianVoice(
  text: string,
  lang: "hi" | "en" | "raj" | string,
  onEnd?: () => void,
  onError?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  // Convert text into Rajasthani if requested
  const textToSpeak = lang === "raj" ? toRajasthani(text) : text;

  // Use async voice resolution so we get the right voice even if voices haven't loaded
  getBestVoice(lang).then((voice) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = (lang === "hi" || lang === "raj") ? "hi-IN" : "en-IN";
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    if (voice) utterance.voice = voice;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;
    window.speechSynthesis.speak(utterance);
  });

  return true;
}
