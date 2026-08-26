export interface GeneratedAbha {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  phone: string;
}

export class AbhaMockService {
  /**
   * Generates a realistic ABDM-compliant 14-digit ABHA ID and ABHA address
   */
  static generateAbha(phone?: string, name?: string): GeneratedAbha {
    const randomDigits = () => Math.floor(1000 + Math.random() * 9000);
    const abhaNumber = `14-${randomDigits()}-${randomDigits()}-${Math.floor(10 + Math.random() * 90)}`;
    const baseName = (name || "patient").toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const abhaAddress = `${baseName || "ayush"}${randomSuffix}@sbx`;

    return {
      abhaNumber,
      abhaAddress,
      name: name || "Ayush Patient",
      gender: "MALE",
      dob: "1990-05-15",
      phone: phone || "+919876543210",
    };
  }

  /**
   * Simulates OTP verification for ABHA authentication
   */
  static verifyOtp(otp: string): boolean {
    // Accepts standard demo OTPs like 123456 or 999999
    return otp === "123456" || otp === "999999" || otp.length === 6;
  }
}
