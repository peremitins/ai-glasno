import { NavLink, Outlet } from "react-router";

const getNavigationClassName = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-semibold text-foreground"
    : "text-muted-foreground hover:text-foreground";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <nav
          aria-label="Основная навигация"
          className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
        >
          <NavLink className="text-lg font-semibold tracking-tight" to="/" end>
            Гласно
          </NavLink>
          <div className="flex items-center gap-6 text-sm">
            <NavLink className={getNavigationClassName} to="/" end>
              Главная
            </NavLink>
            <NavLink className={getNavigationClassName} to="/auth">
              Войти
            </NavLink>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}
