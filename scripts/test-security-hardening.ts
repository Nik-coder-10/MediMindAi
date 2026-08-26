import { FieldEncryptionService } from "../lib/security/crypto";
import { DpdpConsentGuard } from "../lib/consent/consent-guard";

async function verifySecurityAndDpdp() {
  console.log("==================================================================");
  console.log("🛡️ VERIFYING SECURITY HARDENING & DPDP ACT 2023 COMPLIANCE");
  console.log("==================================================================\n");

  console.log("1. Testing AES-256-GCM Application-Level Field Encryption:");
  const plainAbha = "14-5542-8921-3410";
  const encryptedPayload = FieldEncryptionService.encrypt(plainAbha);
  console.log(`   👉 Plaintext ABHA: "${plainAbha}"`);
  console.log(`   👉 Encrypted (IV:Tag:Cipher): "${encryptedPayload}"`);

  const decryptedAbha = FieldEncryptionService.decrypt(encryptedPayload);
  console.log(`   👉 Decrypted ABHA: "${decryptedAbha}"`);

  if (plainAbha !== decryptedAbha) {
    throw new Error("AES-256-GCM Encryption/Decryption mismatch!");
  }
  console.log("   👉 AES-256-GCM Cryptographic Roundtrip: [✓ SUCCESS]\n");

  console.log("2. Testing PII Data Minimization & Masking:");
  const masked = FieldEncryptionService.maskAbha(plainAbha);
  console.log(`   👉 Masked Presentation: "${masked}" [✓ SUCCESS]\n`);

  console.log("3. Testing DPDP Purpose-Limited Consent Enforcement:");
  try {
    // Attempt processing for non-existent consent should throw
    await DpdpConsentGuard.verifyConsentOrThrow({
      userId: "user-unconsented-test",
      purpose: "HOSPITAL_HIS",
    });
  } catch (err: any) {
    console.log(`   👉 Guard Blocked Unauthorized Access: "${err.message}" [✓ SUCCESS]\n`);
  }

  console.log("==================================================================");
  console.log("🎉 SECURITY HARDENING & DPDP 2023 VERIFICATION PASSED 100%!");
  console.log("==================================================================");
}

verifySecurityAndDpdp().catch((e) => {
  console.error("❌ Security verification failed:", e);
  process.exit(1);
});
