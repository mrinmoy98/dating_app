import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, type MatchUser } from "../../lib/api";

interface MatchState {
  matches: MatchUser[];
  loading: boolean;
}

const initialState: MatchState = {
  matches: [],
  loading: false,
};

export const fetchMatches = createAsyncThunk("match/fetch", async (token: string) => {
  return await api.matches(token);
});

const matchSlice = createSlice({
  name: "match",
  initialState,
  reducers: {
    addMatch(state, action: PayloadAction<MatchUser>) {
      if (!state.matches.some((m) => m.matchId === action.payload.matchId)) {
        state.matches.unshift(action.payload);
      }
    },
    clearMatches(state) {
      state.matches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.matches = action.payload;
        state.loading = false;
      })
      .addCase(fetchMatches.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { addMatch, clearMatches } = matchSlice.actions;
export default matchSlice.reducer;
