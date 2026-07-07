import React, { createContext, useContext, useMemo, useState } from "react";
import type { RegisterPayload } from "../lib/api";

/**
 * Holds everything collected during the phone → OTP → onboarding flow so each
 * screen can contribute its field and the final screen submits the whole
 * profile. Also stores the auth token after login/registration.
 *
 * NOTE: state lives in memory only. For persistence across app restarts, back
 * `authToken` with expo-secure-store / AsyncStorage (see README).
 */
type RegistrationData = Partial<RegisterPayload>;

interface RegistrationContextValue {
  phone: string;
  email: string;
  registrationToken: string | null;
  authToken: string | null;
  user: any | null;
  data: RegistrationData;

  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  setRegistrationToken: (token: string | null) => void;
  setAuth: (token: string, user: any) => void;
  /** Merge one or more onboarding fields into the collected profile. */
  patch: (partial: RegistrationData) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [data, setData] = useState<RegistrationData>({});

  const value = useMemo<RegistrationContextValue>(
    () => ({
      phone,
      email,
      registrationToken,
      authToken,
      user,
      data,
      setPhone,
      setEmail,
      setRegistrationToken,
      setAuth: (token, u) => {
        setAuthToken(token);
        setUser(u);
      },
      patch: (partial) => setData((prev) => ({ ...prev, ...partial })),
      reset: () => {
        setPhone("");
        setEmail("");
        setRegistrationToken(null);
        setAuthToken(null);
        setUser(null);
        setData({});
      },
    }),
    [phone, email, registrationToken, authToken, user, data],
  );

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return ctx;
}
