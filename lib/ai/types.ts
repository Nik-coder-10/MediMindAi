export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface PrakritiAnalysisInput {
  responses: Record<string, string | number>;
  physicalTraits: Record<string, string>;
  lifestyleFactors: Record<string, string>;
}

export interface PrakritiAnalysisResult {
  dominantDosha: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  doshaScores: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  recommendations: {
    diet: string[];
    lifestyle: string[];
    herbs: string[];
  };
  reasoning: string;
}

export interface AIServiceProvider {
  chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
  analyzePrakriti(input: PrakritiAnalysisInput): Promise<PrakritiAnalysisResult>;
  extractClinicalEntities(text: string): Promise<Record<string, unknown>>;
}
