import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionDraft } from "@/entities/session/model/types";

export const initialSessionDraft: SessionDraft = {
  vacancy: "",
  profile: "",
  format: "technical",
  level: "middle",
  questionsCount: 10,
  durationMinutes: 45,
  includeHints: true,
};

type InterviewState = {
  draft: SessionDraft;
};

const initialState: InterviewState = {
  draft: initialSessionDraft,
};

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    saveDraft(state, action: PayloadAction<SessionDraft>) {
      state.draft = action.payload;
    },
    clearDraft(state) {
      state.draft = initialSessionDraft;
    },
  },
});

export const { clearDraft, saveDraft } = interviewSlice.actions;
export const interviewReducer = interviewSlice.reducer;
