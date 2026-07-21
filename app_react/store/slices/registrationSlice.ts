import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RegisterPayload } from "../../lib/api";

type RegistrationData = Partial<RegisterPayload>;

interface RegistrationState {
  phone: string;
  email: string;
  registrationToken: string | null;
  data: RegistrationData;
}

const initialState: RegistrationState = {
  phone: "",
  email: "",
  registrationToken: null,
  data: {},
};

const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    setPhone(state, action: PayloadAction<string>) {
      state.phone = action.payload;
    },
    setEmail(state, action: PayloadAction<string>) {
      state.email = action.payload;
    },
    setRegistrationToken(state, action: PayloadAction<string | null>) {
      state.registrationToken = action.payload;
    },
    patchData(state, action: PayloadAction<RegistrationData>) {
      state.data = { ...state.data, ...action.payload };
    },
    resetRegistration() {
      return initialState;
    },
  },
});

export const {
  setPhone,
  setEmail,
  setRegistrationToken,
  patchData,
  resetRegistration,
} = registrationSlice.actions;
export default registrationSlice.reducer;
