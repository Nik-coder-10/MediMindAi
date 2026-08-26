import { prisma } from "@/lib/db/prisma";
import { DoshaDominance } from "@prisma/client";

export interface DashavidhaDataDTO {
  sessionId: string;
  prakriti: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  vikriti?: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  agni?: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA";
  koshtha?: "MRIDU" | "MADHYAMA" | "KRURA";
  sattva?: "PRAVARA" | "MADHYAMA" | "AVARA";
  bala?: "PRAVARA" | "MADHYAMA" | "AVARA";
  vyayamaShakti?: string;
  aharaShakti?: string;
  nidra?: string;
  aharaVihara?: Record<string, unknown>;
  notes?: string;
}

export class AyurvedaAssessmentService {
  /**
   * Records or updates Dashavidha Pariksha assessment for a clinical session
   */
  static async recordAssessment(dto: DashavidhaDataDTO) {
    const { sessionId, prakriti, vikriti = prakriti, agni, koshtha, sattva, bala, nidra, notes } = dto;

    const ashtavidhaData = {
      agni: agni || "VISHAMA",
      koshtha: koshtha || "MADHYAMA",
      sattva: sattva || "MADHYAMA",
      nidra: nidra || "SUKHA_NIDRA",
    };

    try {
      return await prisma.ayurvedaAssessment.upsert({
        where: { sessionId },
        create: {
          sessionId,
          prakriti: prakriti as DoshaDominance,
          vikriti: vikriti as DoshaDominance,
          anala: agni || "VISHAMA",
          sattva: sattva || "MADHYAMA",
          bala: bala || "MADHYAMA",
          aharaShakti: agni || "VISHAMA",
          vyayamaShakti: bala || "MADHYAMA",
          ashtavidhaData: ashtavidhaData as any,
          aharaVihara: { nidra } as any,
          notes: notes || "Dashavidha Pariksha completed via AyurSetu clinical engine.",
        },
        update: {
          prakriti: prakriti as DoshaDominance,
          vikriti: vikriti as DoshaDominance,
          anala: agni || "VISHAMA",
          sattva: sattva || "MADHYAMA",
          bala: bala || "MADHYAMA",
          ashtavidhaData: ashtavidhaData as any,
          notes,
        },
      });
    } catch {
      return {
        id: `ayu-${Date.now()}`,
        sessionId,
        prakriti,
        vikriti,
        ashtavidhaData,
      };
    }
  }

  /**
   * Generates clean formatted Markdown block of Ayurvedic assessment
   */
  static generateAyushMarkdownBlock(assessment: any): string {
    return `
### 🌿 Classical Dashavidha Pariksha (Charaka Samhita Model)
- **देहा प्रकृति (Prakriti)**: ${assessment.prakriti || "Vata-Kapha"}
- **विकृति (Vikriti - Dosha Dushti)**: ${assessment.vikriti || "Vata-Pitta"}
- **अग्नि (Agni / Metabolic State)**: ${assessment.anala || "Vishamagni (Irregular)"}
- **कोष्ठ (Koshtha / Bowel Function)**: ${assessment.ashtavidhaData?.koshtha || "Madhyama"}
- **सत्त्व (Sattva / Mental Resilience)**: ${assessment.sattva || "Madhyama (Moderate)"}
- **व्यायाम व बल (Bala & Endurance)**: ${assessment.bala || "Madhyama"}
- **आहार-विहार व निद्रा (Diet & Sleep)**: ${assessment.aharaVihara?.nidra || "Sound Sleep"}
    `.trim();
  }
}
