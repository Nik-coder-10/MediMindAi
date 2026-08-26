export interface TranscribeAudioOptions {
  language?: string;
  sessionId?: string;
  mimeType?: string;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  detectedLanguage?: string;
  audioUrl?: string;
}

export interface SynthesizeSpeechOptions {
  text: string;
  language: string;
  voiceGender?: "FEMALE" | "MALE";
}

export interface SynthesisResult {
  audioUrl: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface VoiceProvider {
  transcribe(
    audioBuffer: Buffer | Blob,
    options?: TranscribeAudioOptions
  ): Promise<TranscriptionResult>;
  synthesize(options: SynthesizeSpeechOptions): Promise<SynthesisResult>;
}

export class MockWhisperVoiceProvider implements VoiceProvider {
  async transcribe(
    audioBuffer: Buffer | Blob,
    options?: TranscribeAudioOptions
  ): Promise<TranscriptionResult> {
    const lang = options?.language || "hi";
    const sampleHindiTranscripts = [
      "मुझे रात से बहुत तेज सीने में भारीपन और दर्द है।",
      "दर्द बाएं हाथ और गर्दन की तरफ भी जा रहा है।",
      "सांस लेने में भी थोड़ी तकलीफ हो रही है।",
      "हल्का चक्कर आ रहा है और पसीना भी हो रहा है।",
    ];

    const randomIndex = Math.floor(Math.random() * sampleHindiTranscripts.length);
    const transcript =
      lang.startsWith("hi")
        ? sampleHindiTranscripts[randomIndex]
        : "I have been experiencing heavy chest discomfort radiating to my left arm.";

    return {
      transcript,
      confidence: 0.96,
      detectedLanguage: lang,
      audioUrl: `/uploads/audio/mock-${Date.now()}.webm`,
    };
  }

  async synthesize(options: SynthesizeSpeechOptions): Promise<SynthesisResult> {
    return {
      audioUrl: `/audio/synthesized-prompt-${options.language}.mp3`,
      mimeType: "audio/mpeg",
      durationSeconds: 3.5,
    };
  }
}

export class VoiceService {
  private static provider: VoiceProvider = new MockWhisperVoiceProvider();

  static setProvider(newProvider: VoiceProvider) {
    this.provider = newProvider;
  }

  static async transcribeAudio(
    audioBuffer: Buffer | Blob,
    options?: TranscribeAudioOptions
  ): Promise<TranscriptionResult> {
    return await this.provider.transcribe(audioBuffer, options);
  }

  static async synthesizeSpeech(options: SynthesizeSpeechOptions): Promise<SynthesisResult> {
    return await this.provider.synthesize(options);
  }
}
