import {
  AudioLines,
  CameraOff,
  Expand,
  LogOut,
  MessageCircle,
  Mic,
  MicOff,
  Minimize,
  Send,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  sessionApi,
  useCompleteSessionMutation,
  useGetInterviewWorkspaceQuery,
  useNextQuestionMutation,
} from "@/entities/session/api/sessionApi";
import { streamInterviewReply } from "@/entities/session/api/interviewTransport";
import {
  clearSessionAnswerDraft,
  closeHints,
  setSessionAnswerDraft,
  toggleHints,
} from "@/features/interview/model/interviewSlice";
import { useRealtimeVoice } from "@/features/realtime-voice/model/useRealtimeVoice";
import { getApiErrorMessage } from "@/shared/api/baseApi";
import { getBrowserCapabilities } from "@/shared/lib/browserCapabilities";
import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionInstance,
} from "@/shared/lib/speechRecognition";

import "./InterviewPage.css";

export function InterviewPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const answerDraft = useAppSelector(
    (state) => state.interview.answerDrafts[id] ?? "",
  );
  const hintsOpen = useAppSelector((state) => state.interview.hintsOpen);
  const { data, error, isLoading } = useGetInterviewWorkspaceQuery(id, {
    skip: !id,
  });
  const [nextQuestion, nextQuestionState] = useNextQuestionMutation();
  const [completeSession, completeSessionState] = useCompleteSessionMutation();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [streamingReply, setStreamingReply] = useState("");
  const [pendingCandidateMessage, setPendingCandidateMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const answerDraftRef = useRef(answerDraft);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const realtimeAudioRef = useRef<HTMLAudioElement>(null);
  const realtimeVoice = useRealtimeVoice({
    audioRef: realtimeAudioRef,
    onError: setActionError,
    onWorkspace: (workspace) => {
      dispatch(
        sessionApi.util.updateQueryData(
          "getInterviewWorkspace",
          id,
          () => workspace,
        ),
      );
    },
    question: data?.currentTurn?.question ?? null,
    sessionId: id,
    turnId: data?.currentTurn?.id ?? null,
  });
  const capabilities = getBrowserCapabilities();
  const isBusy =
    nextQuestionState.isLoading ||
    completeSessionState.isLoading ||
    isStreaming ||
    realtimeVoice.isBusy;

  useEffect(
    () => () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      speechRecognitionRef.current?.stop();
    },
    [],
  );

  useEffect(() => {
    answerDraftRef.current = answerDraft;
  }, [answerDraft]);

  useEffect(() => {
    if (isBusy && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
  }, [isBusy]);

  useEffect(() => {
    const preview = cameraPreviewRef.current;
    const stream = cameraStreamRef.current;
    if (!cameraEnabled || !preview || !stream) return;

    preview.srcObject = stream;
    const playback = preview.play();
    if (playback) void playback.catch(() => {});
  }, [cameraEnabled]);

  function toggleDictation() {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setActionError(
        "Голосовой ввод не поддерживается. Продолжите отвечать текстом.",
      );
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
      const separator = answerDraftRef.current.trim() ? " " : "";
      dispatch(
        setSessionAnswerDraft({
          sessionId: id,
          value: `${answerDraftRef.current}${separator}${transcript}`,
        }),
      );
    };
    recognition.onerror = (event) => {
      setActionError(
        event.error === "not-allowed"
          ? "Нет доступа к микрофону. Разрешите его в настройках браузера или продолжите текстом."
          : "Не удалось распознать речь. Можно продолжить в текстовом режиме.",
      );
    };
    recognition.onend = () => {
      speechRecognitionRef.current = null;
      setIsDictating(false);
    };

    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      setActionError(null);
      setIsDictating(true);
    } catch {
      setActionError("Не удалось включить голосовой ввод. Продолжите текстом.");
    }
  }

  async function toggleCamera() {
    if (cameraEnabled) {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraEnabled(false);
      return;
    }

    if (!capabilities.camera) {
      setActionError("Камера не поддерживается в этом браузере.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          height: { ideal: 540 },
          width: { ideal: 960 },
        },
      });
      cameraStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (cameraStreamRef.current !== stream) return;
          cameraStreamRef.current = null;
          setCameraEnabled(false);
          setActionError(
            "Поток камеры остановлен. При необходимости включите камеру снова.",
          );
        });
      });
      setActionError(null);
      setCameraEnabled(true);
    } catch {
      setActionError(
        "Не удалось получить доступ к камере. Можно продолжить в текстовом режиме.",
      );
    }
  }

  function toggleFullscreen() {
    setFullscreen((currentValue) => !currentValue);
    setActionError(null);
  }

  if (isLoading) return <SessionLoading />;

  if (error || !data) {
    const isNotFound = isApiErrorWithStatus(error, 404);
    return (
      <section className="session-state glass-frame">
        <p className="session-eyebrow">Интервью</p>
        <h1>
          {isNotFound ? "Сессия не найдена" : "Не удалось открыть сессию"}
        </h1>
        <p>
          {isNotFound
            ? "Проверьте ссылку или выберите другую сессию в истории."
            : getApiErrorMessage(error)}
        </p>
      </section>
    );
  }

  const { currentTurn, session, totalQuestions } = data;
  const isCompleted = session.status === "completed" || !currentTurn;

  async function handleSendMessage() {
    const message = answerDraft.trim();
    if (!currentTurn || !message) {
      setActionError("Введите ответ перед отправкой.");
      return;
    }
    setActionError(null);
    setNotice(null);
    setStreamingReply("");
    setPendingCandidateMessage(message);
    dispatch(clearSessionAnswerDraft(id));
    setIsStreaming(true);
    try {
      const workspace = await streamInterviewReply(
        {
          sessionId: id,
          turnId: currentTurn.id,
          message,
        },
        { onDelta: (delta) => setStreamingReply((text) => text + delta) },
      );
      dispatch(
        sessionApi.util.updateQueryData(
          "getInterviewWorkspace",
          id,
          () => workspace,
        ),
      );
      setPendingCandidateMessage("");
      setStreamingReply("");
    } catch (requestError) {
      dispatch(setSessionAnswerDraft({ sessionId: id, value: message }));
      setPendingCandidateMessage("");
      setStreamingReply("");
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleNextQuestion() {
    if (!currentTurn) return;
    setActionError(null);
    setNotice(null);
    dispatch(closeHints());
    try {
      await nextQuestion({ sessionId: id, turnId: currentTurn.id }).unwrap();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    }
  }

  async function handleComplete() {
    setActionError(null);
    setNotice(null);
    try {
      await completeSession(id).unwrap();
      dispatch(closeHints());
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    }
  }

  if (isCompleted) {
    return (
      <section className="session-state glass-frame">
        <p className="session-eyebrow">Интервью завершено</p>
        <h1>Сессия завершена</h1>
        <p>
          Ответы сохранены. Результаты появятся в истории сессий после
          обработки.
        </p>
      </section>
    );
  }

  const progress = Math.round((currentTurn.index / totalQuestions) * 100);
  return (
    <section className="interview-workspace">
      <audio
        aria-hidden="true"
        className="realtime-audio"
        ref={realtimeAudioRef}
      />
      <header className="session-header glass-frame glass-frame--soft">
        <div>
          <p className="session-eyebrow">
            Вопрос {currentTurn.index} из {totalQuestions}
          </p>
          <h1>{session.title}</h1>
        </div>
      </header>
      <div className="session-progress" aria-label={`Прогресс ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <section className={`call ${fullscreen ? "call--fs" : ""}`}>
        <div className="call-stage">
          <div className="videos">
            <section className="vtile vtile--peer">
              <div className="interviewer interviewer--photo">
                <img
                  alt="Нейтральный профиль интервьюера"
                  className="interviewer-photo"
                  src="/interviewers/male-neutral.webp"
                />
                <div className="photo-shade" aria-hidden="true" />
                <div className="interviewer-meta">
                  <p>Интервьюер</p>
                  <h2>Нейтральный профиль</h2>
                  <span>Слушает</span>
                </div>
              </div>
            </section>
            <section className="vtile vtile--self">
              {cameraEnabled ? (
                <video
                  aria-label="Локальное видео"
                  autoPlay
                  className="camera-video"
                  muted
                  playsInline
                  ref={cameraPreviewRef}
                />
              ) : (
                <div className="camera-placeholder">
                  <CameraOff aria-hidden="true" />
                </div>
              )}
              <span className="vtile-name">Вы</span>
              <span className="camera-status">
                {cameraEnabled ? "Камера включена" : "Камера выключена"}
              </span>
            </section>
          </div>
          <main className="now-question">
            <div className="now-question-meta">
              <span className="badge">Вопрос {currentTurn.index}</span>
            </div>
            <p>{currentTurn.question}</p>
          </main>
          <section className="dock glass-frame" aria-label="Управление сессией">
            <button
              aria-label={
                cameraEnabled ? "Выключить камеру" : "Включить камеру"
              }
              className={`dock-btn ${cameraEnabled ? "dock-btn--active" : "dock-btn--off"}`}
              disabled={isBusy}
              onClick={toggleCamera}
              type="button"
            >
              <Video aria-hidden="true" />
              <span className="dock-label">Камера</span>
            </button>
            <button
              aria-label={chatOpen ? "Скрыть чат" : "Открыть чат"}
              className={`dock-btn ${chatOpen ? "dock-btn--active" : ""}`}
              disabled={isBusy}
              onClick={() => setChatOpen((value) => !value)}
              type="button"
            >
              <MessageCircle aria-hidden="true" />
              <span className="dock-label">Чат</span>
            </button>
            <button
              aria-label={hintsOpen ? "Скрыть подсказки" : "Открыть подсказки"}
              className={`dock-btn ${hintsOpen ? "dock-btn--active" : ""}`}
              disabled={isBusy}
              onClick={() => dispatch(toggleHints())}
              type="button"
            >
              <Zap aria-hidden="true" />
              <span className="dock-label">Подсказки</span>
            </button>
            <button
              aria-label={
                fullscreen
                  ? "Выйти из полноэкранного режима"
                  : "Открыть полноэкранный режим"
              }
              className={`dock-btn ${fullscreen ? "dock-btn--active" : ""}`}
              disabled={isBusy}
              onClick={toggleFullscreen}
              type="button"
            >
              {fullscreen ? (
                <Minimize aria-hidden="true" />
              ) : (
                <Expand aria-hidden="true" />
              )}
              <span className="dock-label">Экран</span>
            </button>
            <button
              aria-label="Завершить сессию"
              className="dock-btn dock-btn--end"
              disabled={isBusy}
              onClick={handleComplete}
              type="button"
            >
              <LogOut aria-hidden="true" />
              <span className="dock-label">Завершить</span>
            </button>
          </section>
        </div>
        {(chatOpen || hintsOpen) && (
          <div className="call-side">
            {chatOpen && (
              <aside className="side-panel glass-frame" aria-label="Чат">
                <header className="side-head side-head--chat">
                  <h2>Чат</h2>
                  <button
                    className="side-close"
                    aria-label="Закрыть чат"
                    onClick={() => setChatOpen(false)}
                    type="button"
                  >
                    <X aria-hidden="true" />
                  </button>
                </header>
                <ol className="chat-feed" aria-live="polite">
                  {currentTurn.messages.map((message) => (
                    <li
                      className={`chat-message chat-message--${message.role}`}
                      key={message.id}
                    >
                      <p>{message.content}</p>
                    </li>
                  ))}
                  {pendingCandidateMessage && (
                    <li className="chat-message chat-message--candidate">
                      <p>{pendingCandidateMessage}</p>
                    </li>
                  )}
                  {streamingReply && (
                    <li
                      className="chat-message chat-message--interviewer"
                      data-testid="streaming-reply"
                    >
                      <p>{streamingReply}</p>
                    </li>
                  )}
                </ol>
                <button
                  className="next-btn"
                  disabled={isBusy}
                  onClick={handleNextQuestion}
                  type="button"
                >
                  Следующий вопрос
                </button>
                <div className="composer">
                  <textarea
                    aria-label="Ваш ответ"
                    disabled={isBusy}
                    id="interview-answer"
                    onChange={(event) =>
                      dispatch(
                        setSessionAnswerDraft({
                          sessionId: id,
                          value: event.target.value,
                        }),
                      )
                    }
                    placeholder="Ваш ответ или вопрос интервьюеру..."
                    rows={3}
                    value={answerDraft}
                  />
                  {actionError && (
                    <p className="session-error" role="alert">
                      {actionError}
                    </p>
                  )}
                  {notice && (
                    <p className="session-notice" role="status">
                      {notice}
                    </p>
                  )}
                  <div className="composer-actions">
                    <div className="composer-tools">
                      <button
                        aria-label={
                          isDictating
                            ? "Остановить голосовой ввод"
                            : "Начать голосовой ввод"
                        }
                        aria-pressed={isDictating}
                        className={`voice-input ${isDictating ? "voice-input--active" : ""}`}
                        disabled={isBusy || realtimeVoice.isActive}
                        onClick={toggleDictation}
                        type="button"
                      >
                        {isDictating ? (
                          <MicOff aria-hidden="true" />
                        ) : (
                          <Mic aria-hidden="true" />
                        )}
                      </button>
                      <button
                        aria-label={
                          realtimeVoice.isActive
                            ? "Остановить разговор в реальном времени"
                            : "Начать разговор в реальном времени"
                        }
                        aria-pressed={realtimeVoice.isActive}
                        className={`rt-icon ${realtimeVoice.isActive ? "rt-icon--active" : ""}`}
                        disabled={
                          nextQuestionState.isLoading ||
                          completeSessionState.isLoading ||
                          isStreaming ||
                          realtimeVoice.isBusy
                        }
                        onClick={() => void realtimeVoice.toggle()}
                        type="button"
                      >
                        <AudioLines aria-hidden="true" />
                        <span>
                          {realtimeVoice.isActive ? "Остановить" : "Говорить"}
                        </span>
                        {!realtimeVoice.isActive && <small>LIVE</small>}
                      </button>
                    </div>
                    <button
                      aria-label="Отправить ответ"
                      className="send-btn"
                      disabled={
                        isBusy ||
                        realtimeVoice.isActive ||
                        answerDraft.trim().length < 2
                      }
                      onClick={handleSendMessage}
                      type="button"
                    >
                      <Send aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </aside>
            )}
            {hintsOpen && (
              <section
                className="side-panel hints-pane glass-frame"
                aria-label="Подсказки к вопросу"
              >
                <header className="side-head">
                  <h2>Подсказки</h2>
                  <button
                    className="side-close"
                    aria-label="Скрыть подсказки"
                    onClick={() => dispatch(closeHints())}
                    type="button"
                  >
                    <X aria-hidden="true" />
                  </button>
                </header>
                <p className="hint-disclosure">
                  {currentTurn.hint ??
                    "Сформулируйте ответ последовательно и подкрепите его примером."}
                </p>
              </section>
            )}
          </div>
        )}
      </section>
    </section>
  );
}

function isApiErrorWithStatus(error: unknown, status: number) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === status
  );
}

function SessionLoading() {
  return (
    <section className="session-loading" aria-label="Загрузка сессии">
      <div className="session-loading-line" />
      <div className="session-loading-card" />
      <div className="session-loading-card session-loading-card--short" />
    </section>
  );
}
