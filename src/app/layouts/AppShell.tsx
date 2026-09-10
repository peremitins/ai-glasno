import { useState } from "react";
import {
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Gift,
  House,
  Moon,
  PanelTop,
  Share2,
  Sun,
  CircleHelp,
  UserRound,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";

import "./AppShell.css";

const navigation = [
  { to: "/", label: "Главная", Icon: House, end: true },
  { to: "/interview/new", label: "Новая репетиция", Icon: CirclePlus },
  { to: "/history", label: "История", Icon: Clock3 },
];

const unavailableNavigation = [{ label: "База вопросов", Icon: CircleHelp }];

function getNavigationClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "app-nav-item app-nav-item--active" : "app-nav-item";
}

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const profilePath = "/profile";
  const profileLabel = "Профиль";
  const profileButtonLabel = "Открыть профиль";

  function toggleTheme() {
    setIsLightTheme((currentValue) => {
      const nextValue = !currentValue;

      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = nextValue ? "light" : "dark";
      }

      return nextValue;
    });
  }

  async function shareService() {
    const shareData = {
      title: "Гласно",
      text: "Репетиция собеседования по вашей вакансии",
      url: typeof window === "undefined" ? "" : window.location.origin,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        setShareMessage("Ссылка отправлена");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setShareMessage("Ссылка скопирована");
      } else {
        setShareMessage("Поделиться ссылкой можно из адресной строки");
      }
    } catch {
      setShareMessage("");
    }
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
          {unavailableNavigation.map(({ Icon, label }) => (
            <button
              aria-label={label}
              className="app-nav-item app-nav-item--unavailable"
              disabled
              key={label}
              title="Раздел появится в следующем этапе"
              type="button"
            >
              <Icon aria-hidden="true" className="app-nav-icon" />
              <span className="app-nav-label">{label}</span>
            </button>
          ))}
          <NavLink className={getNavigationClassName} to="/pricing">
            <ChartNoAxesColumnIncreasing
              aria-hidden="true"
              className="app-nav-icon"
            />
            <span className="app-nav-label">Тарифы</span>
          </NavLink>
          <NavLink className={getNavigationClassName} to="/interview/new">
            <Gift aria-hidden="true" className="app-nav-icon" />
            <span className="app-nav-label">Подарить</span>
          </NavLink>
          <button
            aria-label="Поделиться"
            className="app-nav-item"
            onClick={() => void shareService()}
            type="button"
          >
            <Share2 aria-hidden="true" className="app-nav-icon" />
            <span className="app-nav-label">Поделиться</span>
          </button>
          <NavLink className={getNavigationClassName} to={profilePath}>
            <UserRound aria-hidden="true" className="app-nav-icon" />
            <span className="app-nav-label">{profileLabel}</span>
          </NavLink>
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-progress-card">
            <p className="app-nav-label">Ваш прогресс</p>
            <div className="app-progress-metrics">
              <span>
                <strong>2</strong>
                <small>готово</small>
              </span>
              <span>
                <strong>36/100</strong>
                <small>средний</small>
              </span>
            </div>
          </div>
          <NavLink className="app-pricing-action" to="/pricing">
            <PanelTop aria-hidden="true" />
            <span className="app-nav-label">Открыть тарифы</span>
          </NavLink>
        </div>
      </aside>
      {shareMessage && (
        <p className="share-feedback" role="status">
          {shareMessage}
        </p>
      )}

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
