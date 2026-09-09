import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionInstance,
} from "@/shared/lib/speechRecognition";

import "./VoiceInput.css";

type VoiceInputProps = {
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  onValueChange: (value: string) => void;
  value: string;
};

/** Общая кнопка диктовки с Web Speech API и звуковой обратной связью. */
export function VoiceInput({
  className,
  disabled = false,
  onError,
  onValueChange,
  value,
}: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const valueRef = useRef(value);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  useEffect(() => {
    if (disabled && recognitionRef.current) recognitionRef.current.stop();
  }, [disabled]);

  function stop() {
    recognitionRef.current?.stop();
  }

  function start() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      onError?.("Голосовой ввод не поддерживается. Продолжите вводить текст.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (!transcript) return;

      const separator = valueRef.current.trim() ? " " : "";
      const nextValue = `${valueRef.current}${separator}${transcript}`;
      valueRef.current = nextValue;
      onValueChange(nextValue);
    };
    recognition.onerror = (event) => {
      onError?.(
        event.error === "not-allowed"
          ? "Нет доступа к микрофону. Разрешите его в настройках браузера."
          : "Не удалось распознать речь. Можно продолжить в текстовом режиме.",
      );
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      playVoiceFeedback(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      playVoiceFeedback(true);
    } catch {
      onError?.(
        "Не удалось включить голосовой ввод. Продолжите вводить текст.",
      );
    }
  }

  return (
    <button
      aria-label={
        isListening ? "Остановить голосовой ввод" : "Начать голосовой ввод"
      }
      aria-pressed={isListening}
      className={["mic-button", isListening && "mic-button--active", className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={() => (recognitionRef.current ? stop() : start())}
      title={
        isListening ? "Остановить голосовой ввод" : "Начать голосовой ввод"
      }
      type="button"
    >
      {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
    </button>
  );
}

function playVoiceFeedback(active: boolean) {
  if (typeof window === "undefined") return;
  type AudioContextConstructor = {
    new (): AudioContext;
  };
  const audioWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  const AudioContextConstructor =
    globalThis.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startedAt = context.currentTime;
    const duration = active ? 0.11 : 0.075;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(active ? 740 : 520, startedAt);
    if (active)
      oscillator.frequency.linearRampToValueAtTime(940, startedAt + duration);
    gain.gain.setValueAtTime(0.0001, startedAt);
    gain.gain.exponentialRampToValueAtTime(0.045, startedAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + duration);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Звук не должен мешать основному сценарию диктовки.
  }
}
