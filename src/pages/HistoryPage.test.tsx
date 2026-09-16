import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";
import { API_BASE_URL } from "@/shared/api/baseApi";
import { server } from "@/test/server";

import { HistoryPage } from "./HistoryPage";

const historyResponse = {
  items: [
    {
      id: "session_01",
      title: "Frontend разработчик Senior",
      subtitle: "Dev Company 23",
      status: "running",
      trainingMode: "candidate",
      createdAt: "2026-09-09T10:59:00.000Z",
      answeredQuestions: 4,
      totalQuestions: 6,
      report: null,
    },
    {
      id: "session_02",
      title: "Senior Frontend Developer (Vue.js / Nuxt.js)",
      subtitle: "Selecty",
      status: "completed",
      trainingMode: "interviewer",
      createdAt: "2026-07-22T11:49:00.000Z",
      answeredQuestions: 6,
      totalQuestions: 6,
      report: { id: "report_02", overallScore: 9 },
    },
  ],
};

function renderHistoryPage() {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("HistoryPage", () => {
  it("показывает загрузку истории", () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions/history`, async () => {
        await delay("infinite");

        return HttpResponse.json({ items: [] });
      }),
    );

    renderHistoryPage();

    expect(screen.getByText("Загрузка истории сессий…")).toBeInTheDocument();
  });

  it("показывает карточки сессий как в истории эталона", async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions/history`, () =>
        HttpResponse.json(historyResponse),
      ),
    );

    renderHistoryPage();

    expect(
      await screen.findByRole("heading", {
        name: "Frontend разработчик Senior",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("В процессе")).toBeInTheDocument();
    expect(screen.getByText("Вы — кандидат")).toBeInTheDocument();
    expect(screen.getByText("4 из 6")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Продолжить" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Завершено")).toBeInTheDocument();
    expect(screen.getByText("Вы — интервьюер")).toBeInTheDocument();
    expect(screen.getByText("9/100")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Открыть отчёт" }),
    ).toBeInTheDocument();
  });

  it("открывает подтверждение перед удалением", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE_URL}/sessions/history`, () =>
        HttpResponse.json(historyResponse),
      ),
    );

    renderHistoryPage();
    await user.click(
      await screen.findByRole("button", {
        name: "Удалить сессию Frontend разработчик Senior",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Удалить сессию?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
