import { describe, expect, it } from "vitest";

import { getBrowserCapabilities } from "./browserCapabilities";

describe("getBrowserCapabilities", () => {
  it("возвращает безопасный fallback без браузерного окружения", () => {
    expect(getBrowserCapabilities(undefined)).toEqual({
      camera: false,
      fullscreen: false,
      microphone: false,
      speechRecognition: false,
    });
  });

  it("определяет доступные браузерные возможности", () => {
    const browser = {
      document: { documentElement: { requestFullscreen() {} } },
      navigator: { mediaDevices: { getUserMedia() {} } },
      SpeechRecognition() {},
    } as unknown as Window;

    expect(getBrowserCapabilities(browser)).toEqual({
      camera: true,
      fullscreen: true,
      microphone: true,
      speechRecognition: true,
    });
  });
});
