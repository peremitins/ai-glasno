import { describe, expect, it } from "vitest";

import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionConstructor,
} from "./speechRecognition";

describe("getSpeechRecognitionConstructor", () => {
  it("выбирает стандартную реализацию распознавания речи", () => {
    const SpeechRecognition = class {} as SpeechRecognitionConstructor;

    expect(getSpeechRecognitionConstructor({ SpeechRecognition })).toBe(
      SpeechRecognition,
    );
  });

  it("использует webkit fallback для Safari", () => {
    const webkitSpeechRecognition = class {} as SpeechRecognitionConstructor;

    expect(getSpeechRecognitionConstructor({ webkitSpeechRecognition })).toBe(
      webkitSpeechRecognition,
    );
  });

  it("возвращает null, если браузер не предоставляет Web Speech API", () => {
    expect(getSpeechRecognitionConstructor({})).toBeNull();
  });
});
