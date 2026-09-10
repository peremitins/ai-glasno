import { Link, useSearchParams } from "react-router";

import { useGetSessionsQuery } from "@/entities/session/api/sessionApi";
import {
  getSessionStatusFilter,
  setSessionStatusFilter,
  type SessionStatusFilter,
} from "@/entities/session/model/historyFilters";
import { selectSessionsByStatus } from "@/entities/session/model/selectors";
import { getApiErrorMessage } from "@/shared/api/baseApi";

import "./HistoryPage.css";

const filters: Array<{ value: SessionStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
];

function getEmptyMessage(status: SessionStatusFilter) {
  if (status === "active") return "Активных сессий пока нет.";
  if (status === "completed") return "Завершённых сессий пока нет.";
  return "Сессий пока нет.";
}

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = getSessionStatusFilter(searchParams.get("status"));
  const { data = [], error, isError, isLoading } = useGetSessionsQuery();
  const sessions = selectSessionsByStatus(data, status);

  function handleFilterChange(value: string) {
    const nextStatus = getSessionStatusFilter(value);

    setSearchParams(setSessionStatusFilter(searchParams, nextStatus));
  }

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Загрузка истории сессий"
        className="history-page"
        role="status"
      >
        <span className="sr-only">Загрузка истории сессий…</span>
        <span className="history-skeleton" />
        <span className="history-skeleton" />
        <span className="history-skeleton" />
      </section>
    );
  }

  if (isError) {
    return <p role="alert">{getApiErrorMessage(error)}</p>;
  }

  return (
    <section className="history-page">
      <header className="history-page__head">
        <p className="panel-label">История</p>
        <h1>История сессий</h1>
        <p>Возвращайтесь к завершённым и активным сессиям.</p>
      </header>

      <div className="history-filter">
        <label htmlFor="session-status">Статус</label>
        <select
          className="history-filter__select"
          id="session-status"
          onChange={(event) => handleFilterChange(event.target.value)}
          value={status}
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {sessions.length ? (
        <ul className="history-list glass-frame" aria-label="Список сессий">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                aria-label={`Открыть сессию ${session.title}`}
                className="history-row"
                to={`/interview/${session.id}`}
              >
                <span>
                  <strong>{session.title}</strong>
                  <small>
                    {session.status === "completed"
                      ? "Завершена"
                      : "В процессе"}
                  </small>
                </span>
                <b>
                  {session.status === "completed"
                    ? "Открыть разбор"
                    : "Продолжить"}
                </b>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="history-empty glass-frame">
          <h2>{getEmptyMessage(status)}</h2>
          <p>Новая практика появится здесь после запуска сессии.</p>
          <Link className="primary-action" to="/interview/new">
            Начать сессию
          </Link>
        </section>
      )}
    </section>
  );
}
