import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
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
      <HomePage />
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

    expect(screen.getByRole("status")).toHaveTextContent("Загрузка дашборда");
  });

  it("отображает данные дашборда, полученные через API", async () => {
    server.use(
      http.get(`${API_BASE_URL}/dashboard`, () =>
        HttpResponse.json(
          createDashboardFixture({
            completedSessions: 14,
            nextSession: { topic: "Производительность React" },
          }),
        ),
      ),
    );

    renderHomePage();

    expect(
      await screen.findByRole("heading", { name: "Производительность React" }),
    ).toBeInTheDocument();
    expect(screen.getByText("14 завершённых сессий")).toBeInTheDocument();
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
