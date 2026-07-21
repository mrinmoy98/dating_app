import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type {
  AuthResult,
  RegisterPayload,
  SendOtpResult,
  VerifyEmailResult,
  VerifyOtpResult,
} from "./types";


export const authApi = {
  sendOtp(phone: string) {
    return http.post<SendOtpResult>(ENDPOINTS.auth.sendOtp, { phone });
  },

  verifyOtp(phone: string, code: string) {
    return http.post<VerifyOtpResult>(ENDPOINTS.auth.verifyOtp, { phone, code });
  },

  sendEmailOtp(email: string, registrationToken: string) {
    return http.post<SendOtpResult>(ENDPOINTS.auth.sendEmailOtp, { email }, registrationToken);
  },

  verifyEmailOtp(email: string, code: string, registrationToken: string) {
    return http.post<VerifyEmailResult>(
      ENDPOINTS.auth.verifyEmailOtp,
      { email, code },
      registrationToken,
    );
  },

  register(payload: RegisterPayload, registrationToken: string) {
    return http.post<AuthResult>(ENDPOINTS.auth.register, payload, registrationToken);
  },

  loginPassword(identifier: string, password: string) {
    return http.post<AuthResult>(ENDPOINTS.auth.loginPassword, { identifier, password });
  },

  setPassword(password: string, token: string) {
    return http.post<{ success: boolean; message: string }>(
      ENDPOINTS.auth.setPassword,
      { password },
      token,
    );
  },
};
