export interface ASRTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface VoiceASRService {
  transcribeAudio(audioBuffer: Buffer | Blob, language?: string): Promise<ASRTranscriptionResult>;
}

export class WhisperCompatibleASR implements VoiceASRService {
  async transcribeAudio(audioBuffer: Buffer | Blob, language: string = "hi"): Promise<ASRTranscriptionResult> {
    // Placeholder interface ready for OpenAI Whisper, Bhashini ASR, or local Whisper
    return {
      text: "रुग्णाला २ दिवसांपासून शिरशूल आणि अरुचीचा त्रास आहे (Patient has headache and loss of appetite for 2 days).",
      language,
      confidence: 0.94,
    };
  }
}

export const asrService = new WhisperCompatibleASR();
