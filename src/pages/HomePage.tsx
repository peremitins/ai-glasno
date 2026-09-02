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
    <section className="max-w-2xl space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Дашборд</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Гласно
      </h1>
      <p className="text-lg leading-8 text-muted-foreground">
        {data.completedSessions} завершённых сессий
      </p>
      <p className="text-muted-foreground">
        {data.activeSessions} активные сессии
      </p>
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Следующая сессия</p>
        <h2 className="mt-2 text-xl font-semibold">{data.nextSession.topic}</h2>
      </section>
    </section>
  );
}
