import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";
import { API_BASE_URL } from "@/shared/api/baseApi";
import { createDashboardFixture } from "@/test/factories/dashboard";
import { server } from "@/test/server";

import { HomePage } from "./HomePage";

function renderHomePage() {
  const store = createAppStore();

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("HomePage", () => {
  it("показывает состояние загрузки дашборда", () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard`, async () => {
        await delay("infinite");

        return HttpResponse.json(createDashboardFixture());
      }),
    );

    renderHomePage();

    expect(screen.getByRole("status", { name: "Загрузка дашборда" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("отображает данные дашборда, полученные через API", async () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard`, () =>
        HttpResponse.json(
          createDashboardFixture({
            completedSessions: 14,
          }),
        ),
      ),
    );

    renderHomePage();

    expect(
      await screen.findByRole("heading", { name: "Продолжить подготовку" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Завершено").nextElementSibling).toHaveTextContent("14");
  });

  it("показывает сводку, последние сессии и быстрый старт", async () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard`, () =>
        HttpResponse.json(
          createDashboardFixture({
            activeSessions: 1,
            completedSessions: 4,
            recentSessions: [
              {
                id: "session_01",
                title: "Frontend-разработчик",
                status: "completed",
                completedAt: "2026-09-01T10:00:00.000Z",
              },
            ],
          }),
        ),
      ),
    );

    renderHomePage();

    expect(
      await screen.findByRole("heading", { name: "Продолжить подготовку" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Сессии").nextElementSibling).toHaveTextContent("5");
    expect(screen.getByRole("heading", { name: "Последние интервью" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Настроить подробнее" })).toHaveAttribute(
      "href",
      "/interview/new",
    );
    expect(screen.getByRole("link", { name: "История" })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(screen.getByText("Frontend-разработчик")).toBeInTheDocument();
  });

  it("показывает прикладную ошибку при недоступности дашборда", async () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard`, () =>
        HttpResponse.json(
          {
            code: "dashboard_unavailable",
            message: "Не удалось загрузить данные. Попробуйте ещё раз.",
          },
          { status: 503 },
        ),
      ),
    );

    renderHomePage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить данные. Попробуйте ещё раз.",
    );
  });
});
