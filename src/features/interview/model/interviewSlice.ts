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
  answerDraft: string;
  answerDrafts: Record<string, string>;
  hintsOpen: boolean;
};

const initialState: InterviewState = {
  draft: initialSessionDraft,
  answerDraft: "",
  answerDrafts: {},
  hintsOpen: false,
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
    setAnswerDraft(state, action: PayloadAction<string>) {
      state.answerDraft = action.payload;
    },
    clearAnswerDraft(state) {
      state.answerDraft = "";
    },
    setSessionAnswerDraft(
      state,
      action: PayloadAction<{ sessionId: string; value: string }>,
    ) {
      state.answerDrafts[action.payload.sessionId] = action.payload.value;
    },
    clearSessionAnswerDraft(state, action: PayloadAction<string>) {
      delete state.answerDrafts[action.payload];
    },
    toggleHints(state) {
      state.hintsOpen = !state.hintsOpen;
    },
    closeHints(state) {
      state.hintsOpen = false;
    },
  },
});

export const {
  clearAnswerDraft,
  clearSessionAnswerDraft,
  clearDraft,
  closeHints,
  saveDraft,
  setAnswerDraft,
  setSessionAnswerDraft,
  toggleHints,
} = interviewSlice.actions;
export const interviewReducer = interviewSlice.reducer;
