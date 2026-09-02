import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "./app/AppRouter";

describe("App", () => {
  it("отображает главную страницу с основной навигацией", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRouter />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Гласно" })).toBeInTheDocument();
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
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <AppRouter />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Страница не найдена" }),
    ).toBeInTheDocument();
  });
});
