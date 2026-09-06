import { useState } from "react";
import {
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  House,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";

import "./AppShell.css";

const navigation = [
  { to: "/", label: "Главная", Icon: House, end: true },
  { to: "/interview/new", label: "Новая репетиция", Icon: CirclePlus },
  { to: "/history", label: "История", Icon: Clock3 },
];

function getNavigationClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "app-nav-item app-nav-item--active" : "app-nav-item";
}

export function AppShell() {
  const user = useAppSelector((state) => state.auth.user);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const profilePath = user ? "/profile" : "/auth";
  const profileLabel = user ? "Профиль" : "Войти";
  const profileButtonLabel = user
    ? "Открыть профиль"
    : "Открыть вход в аккаунт";

  function toggleTheme() {
    setIsLightTheme((currentValue) => {
      const nextValue = !currentValue;

      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = nextValue ? "light" : "dark";
      }

      return nextValue;
    });
  }

  return (
    <div
      className={`app-shell${isSidebarCollapsed ? " app-shell--collapsed" : ""}`}
    >
      <aside className="app-sidebar glass-frame glass-frame--soft">
        <div className="app-sidebar-top">
          <NavLink aria-label="Гласно" className="app-brand" to="/" end>
            <img
              alt=""
              aria-hidden="true"
              height="44"
              src="/brand/logo.webp"
              width="44"
            />
            <span className="app-brand-label">Гласно</span>
          </NavLink>
          <button
            aria-label={
              isSidebarCollapsed
                ? "Развернуть боковую панель"
                : "Свернуть боковую панель"
            }
            className="sidebar-toggle"
            onClick={() =>
              setIsSidebarCollapsed((currentValue) => !currentValue)
            }
            type="button"
          >
            {isSidebarCollapsed ? (
              <ChevronRight aria-hidden="true" />
            ) : (
              <ChevronLeft aria-hidden="true" />
            )}
          </button>
        </div>

        <nav aria-label="Навигация приложения" className="app-navigation">
          {navigation.map(({ Icon, end, label, to }) => (
            <NavLink
              className={getNavigationClassName}
              end={end}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" className="app-nav-icon" />
              <span className="app-nav-label">{label}</span>
            </NavLink>
          ))}
          <NavLink className={getNavigationClassName} to={profilePath}>
            <UserRound aria-hidden="true" className="app-nav-icon" />
            <span className="app-nav-label">{profileLabel}</span>
          </NavLink>
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-progress-card">
            <ChartNoAxesColumnIncreasing aria-hidden="true" />
            <div>
              <span className="app-nav-label">Практика</span>
              <strong className="app-nav-label">
                Начните первую репетицию
              </strong>
            </div>
          </div>
        </div>
      </aside>

      <section className="app-workspace">
        <header className="app-topbar glass-frame glass-frame--soft">
          <div>
            <p>Гласно</p>
            <span>Практика для уверенных ответов</span>
          </div>
          <div className="app-topbar-actions">
            <button
              aria-label={
                isLightTheme ? "Включить тёмную тему" : "Включить светлую тему"
              }
              className="topbar-icon-button"
              onClick={toggleTheme}
              type="button"
            >
              {isLightTheme ? (
                <Moon aria-hidden="true" />
              ) : (
                <Sun aria-hidden="true" />
              )}
            </button>
            <NavLink
              aria-label={profileButtonLabel}
              className="topbar-profile"
              to={profilePath}
            >
              <UserRound aria-hidden="true" />
            </NavLink>
          </div>
        </header>
        <main className="app-workspace-content">
          <Outlet />
        </main>
      </section>

      <nav aria-label="Мобильная навигация" className="app-mobile-navigation">
        {navigation.map(({ Icon, end, label, to }) => (
          <NavLink
            className={getNavigationClassName}
            end={end}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" className="app-nav-icon" />
            <span className="app-nav-label">{label}</span>
          </NavLink>
        ))}
        <NavLink className={getNavigationClassName} to={profilePath}>
          <UserRound aria-hidden="true" className="app-nav-icon" />
          <span className="app-nav-label">{profileLabel}</span>
        </NavLink>
      </nav>
    </div>
  );
}
