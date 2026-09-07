import {
  Camera,
  CameraOff,
  Expand,
  Lightbulb,
  MessageCircle,
  Minimize,
  Send,
  Timer,
  X,
} from "lucide-react";
import { useState } from "react";
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
  clearAnswerDraft,
  closeHints,
  setAnswerDraft,
  toggleHints,
} from "@/features/interview/model/interviewSlice";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import "./InterviewPage.css";

export function InterviewPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const answerDraft = useAppSelector((state) => state.interview.answerDraft);
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
  const [chatOpen, setChatOpen] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (isLoading) return <SessionLoading />;

  if (error || !data) {
    return (
      <section className="session-state glass-frame">
        <p className="session-eyebrow">Интервью</p>
        <h1>Сессия не найдена</h1>
        <p>Проверьте ссылку или выберите другую сессию в истории.</p>
      </section>
    );
  }

  const { currentTurn, session, totalQuestions } = data;
  const isCompleted = session.status === "completed" || !currentTurn;
  const isBusy =
    nextQuestionState.isLoading ||
    completeSessionState.isLoading ||
    isStreaming;

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
    dispatch(clearAnswerDraft());
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
      dispatch(setAnswerDraft(message));
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
    <section
      className={`interview-workspace ${fullscreen ? "interview-workspace--fullscreen" : ""}`}
    >
      <header className="session-header glass-frame glass-frame--soft">
        <div>
          <p className="session-eyebrow">
            Вопрос {currentTurn.index} из {totalQuestions}
          </p>
          <h1>{session.title}</h1>
        </div>
        <div className="session-timer" aria-label="Текстовый режим">
          <Timer aria-hidden="true" />
          <span>Текстовый режим</span>
        </div>
      </header>
      <div className="session-progress" aria-label={`Прогресс ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="interview-video-stage">
        <section className="video-tile video-tile--interviewer">
          <div className="video-avatar" aria-hidden="true">
            ИИ
          </div>
          <span>Интервьюер</span>
          <small>На связи</small>
        </section>
        <section
          className={`video-tile video-tile--candidate ${cameraEnabled ? "video-tile--camera" : ""}`}
        >
          {cameraEnabled ? (
            <Camera aria-hidden="true" />
          ) : (
            <CameraOff aria-hidden="true" />
          )}
          <span>Вы</span>
          <small>
            {cameraEnabled ? "Камера включена" : "Камера выключена"}
          </small>
        </section>
      </div>
      <div className="interview-grid">
        <main className="question-panel glass-frame">
          <p className="session-eyebrow">Текущий вопрос</p>
          <h2>{currentTurn.question}</h2>
          <div className="interview-dialogue" aria-live="polite">
            {currentTurn.messages.map((message) => (
              <article
                className={`dialogue-message dialogue-message--${message.role}`}
                key={message.id}
              >
                <span>
                  {message.role === "interviewer" ? "Интервьюер" : "Вы"}
                </span>
                <p>{message.content}</p>
              </article>
            ))}
            {pendingCandidateMessage && (
              <article className="dialogue-message dialogue-message--candidate">
                <span>Вы</span>
                <p>{pendingCandidateMessage}</p>
              </article>
            )}
            {streamingReply && (
              <article
                className="dialogue-message dialogue-message--interviewer"
                data-testid="streaming-reply"
              >
                <span>Интервьюер</span>
                <p>{streamingReply}</p>
              </article>
            )}
          </div>
          <label className="answer-composer" htmlFor="interview-answer">
            <span>Ваш ответ</span>
            <textarea
              disabled={isBusy}
              id="interview-answer"
              onChange={(event) => dispatch(setAnswerDraft(event.target.value))}
              placeholder="Сформулируйте ответ и приведите пример из практики"
              rows={5}
              value={answerDraft}
            />
          </label>
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
          <div className="session-actions">
            <button
              className="session-button session-button--secondary"
              disabled={isBusy}
              onClick={() => dispatch(toggleHints())}
              type="button"
            >
              <Lightbulb aria-hidden="true" />
              {hintsOpen ? "Скрыть подсказки" : "Показать подсказки"}
            </button>
            <button
              className="session-button session-button--primary"
              disabled={isBusy || answerDraft.trim().length < 2}
              onClick={handleSendMessage}
              type="button"
            >
              <Send aria-hidden="true" />
              Отправить ответ
            </button>
          </div>
        </main>
        <aside className="session-side-panel">
          {chatOpen && (
            <section className="chat-card glass-frame" aria-label="Чат">
              <div className="hint-card-header">
                <h2>Чат</h2>
                <button
                  aria-label="Закрыть чат"
                  onClick={() => setChatOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <p>
                Обсуждение вопроса и ответы интервьюера отображаются в основной
                области.
              </p>
            </section>
          )}
          {hintsOpen && (
            <section
              className="hint-card glass-frame"
              aria-label="Подсказки к вопросу"
            >
              <div className="hint-card-header">
                <div>
                  <p className="session-eyebrow">Подсказка</p>
                  <h2>На что обратить внимание</h2>
                </div>
                <button
                  aria-label="Скрыть подсказки"
                  onClick={() => dispatch(closeHints())}
                  type="button"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <p>
                {currentTurn.hint ??
                  "Сформулируйте ответ последовательно и подкрепите его примером."}
              </p>
            </section>
          )}
          <section className="session-controls glass-frame glass-frame--soft">
            <p className="session-eyebrow">Управление сессией</p>
            <button
              aria-label={chatOpen ? "Скрыть чат" : "Открыть чат"}
              className={`session-button session-button--secondary ${chatOpen ? "session-button--active" : ""}`}
              disabled={isBusy}
              onClick={() => setChatOpen((value) => !value)}
              type="button"
            >
              <MessageCircle aria-hidden="true" />
              {chatOpen ? "Скрыть чат" : "Открыть чат"}
            </button>
            <button
              aria-label={
                cameraEnabled ? "Выключить камеру" : "Включить камеру"
              }
              className="session-button session-button--secondary"
              disabled={isBusy}
              onClick={() => setCameraEnabled((value) => !value)}
              type="button"
            >
              {cameraEnabled ? (
                <Camera aria-hidden="true" />
              ) : (
                <CameraOff aria-hidden="true" />
              )}
              Камера
            </button>
            <button
              aria-label={
                fullscreen
                  ? "Выйти из полноэкранного режима"
                  : "Открыть полноэкранный режим"
              }
              className="session-button session-button--secondary"
              disabled={isBusy}
              onClick={() => setFullscreen((value) => !value)}
              type="button"
            >
              {fullscreen ? (
                <Minimize aria-hidden="true" />
              ) : (
                <Expand aria-hidden="true" />
              )}
              Экран
            </button>
            <button
              className="session-button session-button--primary"
              disabled={isBusy}
              onClick={handleNextQuestion}
              type="button"
            >
              Следующий вопрос
            </button>
            <button
              className="session-button session-button--danger"
              disabled={isBusy}
              onClick={handleComplete}
              type="button"
            >
              Завершить сессию
            </button>
          </section>
        </aside>
      </div>
    </section>
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
