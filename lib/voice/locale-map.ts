export interface VoiceLocaleConfig {
  code: string;
  asrCode: string;
  ttsVoice: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_VOICE_LOCALES: Record<string, VoiceLocaleConfig> = {
  hi: {
    code: "hi",
    asrCode: "hi-IN",
    ttsVoice: "hi-IN-SwaraNeural",
    label: "Hindi",
    nativeLabel: "हिंदी",
  },
  en: {
    code: "en",
    asrCode: "en-IN",
    ttsVoice: "en-IN-NeerjaNeural",
    label: "English (India)",
    nativeLabel: "English",
  },
  mr: {
    code: "mr",
    asrCode: "mr-IN",
    ttsVoice: "mr-IN-AarohiNeural",
    label: "Marathi",
    nativeLabel: "मराठी",
  },
  ta: {
    code: "ta",
    asrCode: "ta-IN",
    ttsVoice: "ta-IN-PallaviNeural",
    label: "Tamil",
    nativeLabel: "தமிழ்",
  },
  bn: {
    code: "bn",
    asrCode: "bn-IN",
    ttsVoice: "bn-IN-TanishaaNeural",
    label: "Bengali",
    nativeLabel: "বাংলা",
  },
  raj: {
    code: "raj",
    asrCode: "hi-IN", // Standard speech recognition with Rajasthani vernacular fallback
    ttsVoice: "hi-IN-SwaraNeural", // Indian native neural cadence
    label: "Rajasthani",
    nativeLabel: "राजस्थानी",
  },
};

export function getVoiceLocale(lang: string): VoiceLocaleConfig {
  return SUPPORTED_VOICE_LOCALES[lang] || SUPPORTED_VOICE_LOCALES.hi;
}
