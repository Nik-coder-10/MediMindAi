export interface AbhaAuthInitResponse {
  txnId: string;
}

export interface AbhaOtpVerifyRequest {
  txnId: string;
  otp: string;
}

export interface AbhaCardData {
  abhaNumber: string;
  healthIdNumber: string;
  name: string;
  gender: string;
  dob: string;
  mobile: string;
  address: string;
  profilePhoto?: string;
  qrCode?: string;
}
