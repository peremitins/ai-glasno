import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";
import { API_BASE_URL } from "@/shared/api/baseApi";
import { server } from "@/test/server";

import { HistoryPage } from "./HistoryPage";

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.search}</output>;
}

function renderHistoryPage(entry = "/history") {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[entry]}>
        <HistoryPage />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );
}

describe("HistoryPage", () => {
  it("меняет URL при выборе фильтра статуса", async () => {
    const user = userEvent.setup();
    renderHistoryPage();

    await user.selectOptions(
      await screen.findByLabelText("Статус"),
      "completed",
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "?status=completed",
    );
  });

  it("показывает пустое состояние для фильтра без сессий", async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions`, () =>
        HttpResponse.json([
          {
            id: "session_01",
            title: "Frontend-разработчик",
            status: "completed",
            completedAt: "2026-09-01T10:00:00.000Z",
          },
        ]),
      ),
    );

    renderHistoryPage("/history?status=active");

    expect(await screen.findByText("Активных сессий пока нет.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Начать сессию" })).toHaveAttribute(
      "href",
      "/interview/new",
    );
  });
});
