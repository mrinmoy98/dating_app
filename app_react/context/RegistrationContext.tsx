import * as SecureStore from "expo-secure-store";
import type { RegisterPayload } from "../lib/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearCredentials, setCredentials, TOKEN_KEY } from "../store/slices/authSlice";
import {
  patchData,
  resetRegistration,
  setEmail,
  setPhone,
  setRegistrationToken,
} from "../store/slices/registrationSlice";


export function useRegistration() {
  const dispatch = useAppDispatch();
  const { authToken, user, isBootstrapping } = useAppSelector((s) => s.auth);
  const { phone, email, registrationToken, data } = useAppSelector((s) => s.registration);

  return {
    phone,
    email,
    registrationToken,
    authToken,
    user,
    data,
    isBootstrapping,

    setPhone: (p: string) => dispatch(setPhone(p)),
    setEmail: (e: string) => dispatch(setEmail(e)),
    setRegistrationToken: (t: string | null) => dispatch(setRegistrationToken(t)),

    setAuth: (token: string, u: any) => {
      dispatch(setCredentials({ token, user: u }));
      SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
    },

    patch: (partial: Partial<RegisterPayload>) => dispatch(patchData(partial)),

    reset: () => {
      dispatch(clearCredentials());
      dispatch(resetRegistration());
      SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    },
  };
}
