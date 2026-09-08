export type BrowserCapabilities = {
  camera: boolean;
  fullscreen: boolean;
  microphone: boolean;
  speechRecognition: boolean;
};

export function getBrowserCapabilities(
  browser: Window | undefined =
    typeof window === "undefined" ? undefined : window,
): BrowserCapabilities {
  const mediaDevices = browser?.navigator?.mediaDevices;
  const speechBrowser = browser as
    | (Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      })
    | undefined;

  return {
    camera: typeof mediaDevices?.getUserMedia === "function",
    fullscreen:
      typeof browser?.document?.documentElement?.requestFullscreen ===
      "function",
    microphone: typeof mediaDevices?.getUserMedia === "function",
    speechRecognition:
      typeof speechBrowser?.SpeechRecognition === "function" ||
      typeof speechBrowser?.webkitSpeechRecognition === "function",
  };
}
