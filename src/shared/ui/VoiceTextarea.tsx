import { Mic, X } from "lucide-react";
import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

import "./VoiceTextarea.css";

type VoiceTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  onValueChange: (value: string) => void;
  value: string;
};

/** Поле ввода с той же компоновкой, что и VoiceTextarea в исходном интерфейсе. */
export function VoiceTextarea({
  className,
  onValueChange,
  value,
  ...props
}: VoiceTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 132)}px`;
  }, [value]);

  return (
    <div className={["voice-textarea", className].filter(Boolean).join(" ")}>
      <textarea
        {...props}
        className="voice-textarea__control"
        onChange={(event) => onValueChange(event.target.value)}
        ref={textareaRef}
        value={value}
      />
      {value && (
        <button
          aria-label="Очистить текст"
          className="voice-textarea__clear"
          onClick={() => onValueChange("")}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      )}
      <span
        aria-hidden="true"
        className="voice-textarea__mic"
        title="Голосовой ввод доступен во время репетиции"
      >
        <Mic />
      </span>
    </div>
  );
}
