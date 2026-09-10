import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  useDeleteHistorySessionMutation,
  useGetHistorySessionsQuery,
} from "@/entities/session/api/sessionApi";
import type { InterviewHistoryItem } from "@/entities/session/model/types";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import "./HistoryPage.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getSessionPath(session: InterviewHistoryItem) {
  return `/interview/${session.id}`;
}

function getActionLabel(session: InterviewHistoryItem) {
  if (session.status === "running") return "Продолжить";
  return session.report?.id ? "Открыть отчёт" : "Открыть разбор";
}

function getProgress(session: InterviewHistoryItem) {
  if (session.status === "completed" && session.report?.overallScore != null) {
    return `${session.report.overallScore}/100`;
  }

  return `${session.answeredQuestions} из ${session.totalQuestions}`;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [sessionToDelete, setSessionToDelete] =
    useState<InterviewHistoryItem | null>(null);
  const {
    data: sessions = [],
    error,
    isError,
    isLoading,
  } = useGetHistorySessionsQuery();
  const [deleteSession, { error: deleteError, isLoading: isDeleting }] =
    useDeleteHistorySessionMutation();

  async function handleDelete() {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete.id).unwrap();
      setSessionToDelete(null);
    } catch {
      // Сообщение API выводится в диалоге, чтобы пользователь мог повторить действие.
    }
  }

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Загрузка истории"
        className="history-page"
        role="status"
      >
        <span className="sr-only">Загрузка истории сессий…</span>
        <div className="history-panel glass-frame">
          <span className="history-skeleton" />
          <span className="history-skeleton" />
          <span className="history-skeleton" />
        </div>
      </section>
    );
  }

  if (isError) return <p role="alert">{getApiErrorMessage(error)}</p>;

  return (
    <section className="history-page">
      {sessions.length ? (
        <div className="history-panel glass-frame">
          <div className="history-list" aria-label="Список сессий">
            {sessions.map((session) => {
              const path = getSessionPath(session);

              return (
                <article
                  aria-label={`Открыть сессию ${session.title}`}
                  className="history-row"
                  key={session.id}
                  onClick={() => navigate(path)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") navigate(path);
                    if (event.key === " ") {
                      event.preventDefault();
                      navigate(path);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div className="history-row__main">
                    <div className="history-row__badges">
                      <span className="history-status">
                        {session.status === "running"
                          ? "В процессе"
                          : "Завершено"}
                      </span>
                      <span className="history-mode">
                        Вы —{" "}
                        {session.trainingMode === "candidate"
                          ? "кандидат"
                          : "интервьюер"}
                      </span>
                    </div>
                    <h1>{session.title}</h1>
                    {session.subtitle && <p>{session.subtitle}</p>}
                  </div>

                  <div className="history-row__meta">
                    <time dateTime={session.createdAt}>
                      {formatDate(session.createdAt)}
                    </time>
                    <strong>{getProgress(session)}</strong>
                  </div>

                  <div
                    className="history-row__actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link className="history-action" to={path}>
                      {getActionLabel(session)}
                    </Link>
                    <button
                      aria-label={`Удалить сессию ${session.title}`}
                      className="history-delete"
                      onClick={() => setSessionToDelete(session)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <section className="history-empty glass-frame">
          <h1>Сессий пока нет</h1>
          <p>Новая практика появится здесь после запуска репетиции.</p>
          <Link className="primary-action" to="/interview/new">
            Начать репетицию
          </Link>
        </section>
      )}

      {sessionToDelete && (
        <div className="history-dialog-backdrop" role="presentation">
          <section
            aria-labelledby="history-delete-title"
            aria-modal="true"
            className="history-dialog glass-frame"
            role="dialog"
          >
            <h2 id="history-delete-title">Удалить сессию?</h2>
            <p>
              История «{sessionToDelete.title}» будет удалена без возможности
              восстановления.
            </p>
            {deleteError && (
              <p className="history-dialog__error" role="alert">
                {getApiErrorMessage(deleteError)}
              </p>
            )}
            <div className="history-dialog__actions">
              <button
                className="history-dialog__cancel"
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                type="button"
              >
                Отмена
              </button>
              <button
                className="history-dialog__confirm"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                type="button"
              >
                {isDeleting ? "Удаление…" : "Удалить"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
