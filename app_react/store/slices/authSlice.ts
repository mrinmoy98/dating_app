import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

export const TOKEN_KEY = "auth_token";

interface AuthState {
  authToken: string | null;
  user: any | null;
  isBootstrapping: boolean;
}

const initialState: AuthState = {
  authToken: null,
  user: null,
  isBootstrapping: true,
};


export const bootstrapSession = createAsyncThunk("auth/bootstrap", async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  try {
    const user = await api.me(token);
    return { token, user };
  } catch {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: any }>) {
      state.authToken = action.payload.token;
      state.user = action.payload.user;
    },
    setUser(state, action: PayloadAction<any>) {
      state.user = action.payload;
    },
    clearCredentials(state) {
      state.authToken = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.authToken = action.payload.token;
          state.user = action.payload.user;
        }
        state.isBootstrapping = false;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.isBootstrapping = false;
      });
  },
});

export const { setCredentials, setUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
