import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";

import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("показывает полную навигацию эталонного сайдбара", () => {
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </Provider>,
    );

    expect(
      screen.getByRole("button", { name: "База вопросов" }),
    ).toBeDisabled();
    expect(screen.getByRole("link", { name: "Тарифы" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "Профиль" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(
      screen.queryByRole("link", { name: "Войти" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Поделиться" })).toBeEnabled();
    expect(screen.getByText("Ваш прогресс")).toBeInTheDocument();
  });

  it("сворачивает сайдбар доступной кнопкой", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </Provider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Свернуть боковую панель" }),
    );

    expect(
      screen.getByRole("button", { name: "Развернуть боковую панель" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Гласно" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("не подсвечивает пункт «Подарить» на маршруте нового интервью", () => {
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter initialEntries={["/interview/new"]}>
          <AppShell />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole("link", { name: "Новое интервью" })).toHaveClass(
      "app-nav-item--active",
    );
    expect(screen.getByRole("link", { name: "Подарить" })).not.toHaveClass(
      "app-nav-item--active",
    );
  });
});
