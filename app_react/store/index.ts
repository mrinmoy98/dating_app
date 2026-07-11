import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import matchReducer from "./slices/matchSlice";
import registrationReducer from "./slices/registrationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    registration: registrationReducer,
    match: matchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
