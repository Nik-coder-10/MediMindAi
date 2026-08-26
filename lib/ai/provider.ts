import { AIServiceProvider, AIMessage, AICompletionOptions, PrakritiAnalysisInput, PrakritiAnalysisResult } from "./types";

export class MockOrOpenAIProvider implements AIServiceProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY || "";
    this.baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    if (!this.apiKey) {
      return `[AI Interface Ready]: Received ${messages.length} messages. Set AI_API_KEY to connect live model.`;
    }
    // Abstracted HTTP call to OpenAI / Azure / Grok / Local Ollama
    return `Simulated LLM response for: ${messages[messages.length - 1]?.content || ""}`;
  }

  async analyzePrakriti(input: PrakritiAnalysisInput): Promise<PrakritiAnalysisResult> {
    return {
      dominantDosha: "VATA_PITTA",
      doshaScores: {
        vata: 45,
        pitta: 35,
        kapha: 20,
      },
      recommendations: {
        diet: ["Warm, freshly cooked meals", "Sweet, sour, and salty tastes in moderation"],
        lifestyle: ["Regular routine with adequate rest", "Abhyanga with sesame oil"],
        herbs: ["Ashwagandha", "Brahmi", "Amalaki"],
      },
      reasoning: "Clinical indicators show predominant Vata fluctuations with secondary Pitta traits.",
    };
  }

  async extractClinicalEntities(text: string): Promise<Record<string, unknown>> {
    return {
      rawText: text,
      entities: {
        symptoms: ["Shirashoola (Headache)", "Agnimandya (Loss of appetite)"],
        duration: "5 days",
        suspectedDosha: "VATA",
      },
    };
  }
}

export const aiProvider = new MockOrOpenAIProvider();
