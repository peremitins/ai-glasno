import { Link, useSearchParams } from "react-router";

import { useGetSessionsQuery } from "@/entities/session/api/sessionApi";
import {
  selectSessionsByStatus,
  type SessionStatusFilter,
} from "@/entities/session/model/selectors";
import { getApiErrorMessage } from "@/shared/api/baseApi";

const filters: Array<{ value: SessionStatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
];

function getStatusFilter(value: string | null): SessionStatusFilter {
  return value === "active" || value === "completed" ? value : "all";
}

function getEmptyMessage(status: SessionStatusFilter) {
  if (status === "active") return "Активных сессий пока нет.";
  if (status === "completed") return "Завершённых сессий пока нет.";
  return "Сессий пока нет.";
}

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = getStatusFilter(searchParams.get("status"));
  const { data = [], error, isError, isLoading } = useGetSessionsQuery();
  const sessions = selectSessionsByStatus(data, status);

  function handleFilterChange(value: string) {
    const nextStatus = getStatusFilter(value);

    setSearchParams(nextStatus === "all" ? {} : { status: nextStatus });
  }

  if (isLoading) {
    return <p role="status">Загрузка истории сессий…</p>;
  }

  if (isError) {
    return <p role="alert">{getApiErrorMessage(error)}</p>;
  }

  return (
    <section className="max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Практика</p>
        <h1 className="text-4xl font-semibold tracking-tight">История сессий</h1>
        <p className="text-muted-foreground">
          Возвращайтесь к завершённым и активным сессиям.
        </p>
      </header>

      <div className="max-w-xs space-y-2">
        <label className="text-sm font-medium" htmlFor="session-status">
          Статус
        </label>
        <select
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
        <ul className="space-y-3" aria-label="Список сессий">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-lg border border-border bg-card p-5">
              <p className="font-semibold">{session.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.status === "completed" ? "Завершена" : "Активна"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-lg border border-dashed border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{getEmptyMessage(status)}</h2>
          <p className="mt-2 text-muted-foreground">
            Новая практика появится здесь после запуска сессии.
          </p>
          <Link
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            to="/interview/new"
          >
            Начать сессию
          </Link>
        </section>
      )}
    </section>
  );
}
