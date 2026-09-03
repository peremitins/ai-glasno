import { Link } from "react-router";

import { useGetDashboardQuery } from "@/entities/dashboard/api/dashboardApi";
import { getApiErrorMessage } from "@/shared/api/baseApi";

export function HomePage() {
  const { data, error, isError, isLoading } = useGetDashboardQuery();

  if (isLoading) {
    return <p role="status">Загрузка дашборда…</p>;
  }

  if (isError) {
    return <p role="alert">{getApiErrorMessage(error)}</p>;
  }

  if (!data) {
    return <p role="alert">Данные дашборда отсутствуют.</p>;
  }

  return (
    <section className="max-w-4xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Дашборд</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Гласно
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Практикуйте интервью и возвращайтесь к разбору результатов.
        </p>
      </header>

      <section aria-label="Сводка" className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Завершено</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.completedSessions} завершённых сессий
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">В работе</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.activeSessions}{" "}
            {data.activeSessions === 1 ? "активная сессия" : "активные сессии"}
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Следующая сессия</p>
        <h2 className="mt-2 text-xl font-semibold">{data.nextSession.topic}</h2>
        <Link
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          to="/interview/new"
        >
          Начать сессию
        </Link>
      </section>

      <section aria-labelledby="recent-sessions-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent-sessions-heading" className="text-xl font-semibold">
            Последние сессии
          </h2>
          <Link className="text-sm font-medium text-primary hover:underline" to="/history">
            История сессий
          </Link>
        </div>
        {data.recentSessions.length ? (
          <ul className="space-y-3">
            {data.recentSessions.map((session) => (
              <li key={session.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{session.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.status === "completed" ? "Завершена" : "Активна"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-muted-foreground">
            Сессий пока нет. Начните первую практику.
          </p>
        )}
      </section>
    </section>
  );
}
