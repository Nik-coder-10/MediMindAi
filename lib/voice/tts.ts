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
    // Placeholder interface for OpenAI TTS, Azure Speech, or Bhashini TTS
    return new ArrayBuffer(0);
  }
}

export const ttsService = new StandardTTSService();
