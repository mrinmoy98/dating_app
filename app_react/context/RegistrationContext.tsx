import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api, type RegisterPayload } from "../lib/api";

/**
 * Holds everything collected during the phone → OTP → onboarding flow so each
 * screen can contribute its field and the final screen submits the whole
 * profile. Also stores the auth token after login/registration.
 *
 * The auth token is PERSISTED to the device (expo-secure-store), so the user
 * stays logged in across app restarts. On launch we read it back and refresh
 * the user via /api/auth/me. `isBootstrapping` is true until that finishes.
 */
type RegistrationData = Partial<RegisterPayload>;

const TOKEN_KEY = "auth_token";

interface RegistrationContextValue {
  phone: string;
  email: string;
  registrationToken: string | null;
  authToken: string | null;
  user: any | null;
  data: RegistrationData;
  /** True while we restore the saved session on launch. */
  isBootstrapping: boolean;

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // ---- Restore a saved session on app launch ----
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (savedToken) {
          // Validate the token by fetching the current user. If it's expired or
          // invalid, drop it so the user is sent to the login flow.
          try {
            const me = await api.me(savedToken);
            setAuthToken(savedToken);
            setUser(me);
          } catch {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } catch {
        // ignore storage errors — treat as logged out
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const value = useMemo<RegistrationContextValue>(
    () => ({
      phone,
      email,
      registrationToken,
      authToken,
      user,
      data,
      isBootstrapping,
      setPhone,
      setEmail,
      setRegistrationToken,
      setAuth: (token, u) => {
        setAuthToken(token);
        setUser(u);
        // Persist so the session survives an app restart.
        SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
      },
      patch: (partial) => setData((prev) => ({ ...prev, ...partial })),
      reset: () => {
        setPhone("");
        setEmail("");
        setRegistrationToken(null);
        setAuthToken(null);
        setUser(null);
        setData({});
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      },
    }),
    [phone, email, registrationToken, authToken, user, data, isBootstrapping],
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