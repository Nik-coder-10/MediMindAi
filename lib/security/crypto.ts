import crypto from "crypto";

// Fallback secure 256-bit key for local development
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY
  ? Buffer.from(process.env.ENCRYPTION_SECRET_KEY, "hex")
  : crypto.createHash("sha256").update("sih-2026-medimind-secure-master-key-256").digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // Standard 128-bit authentication tag

export class FieldEncryptionService {
  /**
   * Encrypts plaintext using AES-256-GCM
   * Output format: hex(iv):hex(authTag):hex(ciphertext)
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext formatted as hex(iv):hex(authTag):hex(ciphertext)
   */
  static decrypt(encryptedPayload: string): string {
    if (!encryptedPayload || !encryptedPayload.includes(":")) return encryptedPayload;

    try {
      const parts = encryptedPayload.split(":");
      if (parts.length !== 3) return encryptedPayload;

      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch {
      // In case payload was not encrypted or key mismatch
      return encryptedPayload;
    }
  }

  /**
   * Masks sensitive PII for safe presentation (e.g. 14-5542-XXXX-XXXX)
   */
  static maskAbha(abha: string): string {
    if (!abha || abha.length < 10) return abha;
    return `${abha.substring(0, 7)}-XXXX-${abha.substring(abha.length - 4)}`;
  }
}

/**
 * Returns true if AES-256-GCM encryption is operational and key is properly sized
 */
export function isCryptoConfigured(): boolean {
  try {
    const testPlain = "medimind-probe-token";
    const enc = FieldEncryptionService.encrypt(testPlain);
    const dec = FieldEncryptionService.decrypt(enc);
    return dec === testPlain && ENCRYPTION_KEY.length === 32;
  } catch {
    return false;
  }
}
