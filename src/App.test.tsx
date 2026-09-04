import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "./app/AppRouter";
import { AppProviders } from "./app/providers/AppProviders";

describe("App", () => {
  it("отображает главную страницу с основной навигацией", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <AppRouter />
        </MemoryRouter>
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", { name: "Продолжить подготовку" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Главная" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute(
      "href",
      "/auth",
    );
  });

  it("показывает страницу 404 для неизвестного маршрута", () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/unknown-route"]}>
          <AppRouter />
        </MemoryRouter>
      </AppProviders>,
    );

    expect(
      screen.getByRole("heading", { name: "Страница не найдена" }),
    ).toBeInTheDocument();
  });
});
