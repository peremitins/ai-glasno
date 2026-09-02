import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">Ошибка 404</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Страница не найдена
      </h1>
      <Link className="text-sm font-medium text-foreground underline" to="/">
        Вернуться на главную
      </Link>
    </section>
  );
}
