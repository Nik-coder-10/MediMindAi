import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface AbhaProfile {
  healthIdNumber: string;
  healthId: string;
  name: string;
  gender: string;
  yearOfBirth: string;
  monthOfBirth: string;
  dayOfBirth: string;
  mobile: string;
  email: string;
  pincode: string;
}

export function AbhaMockProvider(options: OAuthUserConfig<AbhaProfile>): OAuthConfig<AbhaProfile> {
  return {
    id: "abha",
    name: "ABHA (Ayushman Bharat Health Account)",
    type: "oauth",
    authorization: {
      url: "https://healthidsbx.abdm.gov.in/api/v1/auth/init",
      params: { scope: "openid profile" },
    },
    token: "https://healthidsbx.abdm.gov.in/api/v1/auth/confirmWithOtp",
    userinfo: "https://healthidsbx.abdm.gov.in/api/v1/account/profile",
    profile(profile) {
      return {
        id: profile.healthIdNumber || "abha_mock_id",
        name: profile.name || "Ayush Patient",
        email: profile.email || `${profile.healthId || "patient"}@abha.gov.in`,
        image: null,
        role: "PATIENT",
      };
    },
    options,
  };
}
