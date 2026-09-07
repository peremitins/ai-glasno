import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";

function renderInterviewPage(path = "/interview/session_01") {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>,
  );
}

describe("InterviewPage", () => {
  it("показывает вопрос, прогресс и подсказки активной сессии", async () => {
    renderInterviewPage();

    expect(
      await screen.findByRole("heading", { name: "Практика TypeScript" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Вопрос 1 из 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Объясните разницу между type и interface в TypeScript.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Показать подсказки" }),
    ).toBeInTheDocument();
  });

  it("открывает и скрывает боковой чат через панель управления", async () => {
    const user = userEvent.setup();
    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });
    expect(screen.getByRole("heading", { name: "Чат" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Скрыть чат" }));
    expect(
      screen.queryByRole("heading", { name: "Чат" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Открыть чат" }));
    expect(
      await screen.findByRole("heading", { name: "Чат" }),
    ).toBeInTheDocument();
  });

  it("позволяет перейти к следующему вопросу после диалога", async () => {
    const user = userEvent.setup();

    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });

    await user.type(
      screen.getByLabelText("Ваш ответ"),
      "Оба позволяют описывать форму данных.",
    );
    await user.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await screen.findByText(
      "Верно. Приведите пример, где декларативное слияние действительно полезно.",
    );

    await user.click(screen.getByRole("button", { name: "Следующий вопрос" }));

    expect(await screen.findByText("Вопрос 2 из 3")).toBeInTheDocument();
    expect(
      screen.getByText("Когда стоит использовать unknown вместо any?"),
    ).toBeInTheDocument();
  });

  it("отправляет реплику интервьюеру и показывает потоковый ответ модели", async () => {
    const user = userEvent.setup();

    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });

    await user.type(
      screen.getByLabelText("Ваш ответ"),
      "Interface поддерживает декларативное слияние, а type — нет.",
    );
    await user.click(screen.getByRole("button", { name: "Отправить ответ" }));

    expect(
      await screen.findByText(
        "Верно. Приведите пример, где декларативное слияние действительно полезно.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ваш ответ")).toHaveValue("");
  });

  it("показывает завершённое состояние после окончания сессии", async () => {
    const user = userEvent.setup();

    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });

    await user.click(screen.getByRole("button", { name: "Завершить сессию" }));

    expect(
      await screen.findByRole("heading", { name: "Сессия завершена" }),
    ).toBeInTheDocument();
  });

  it("сообщает, если сессия не найдена", async () => {
    renderInterviewPage("/interview/unknown");

    expect(
      await screen.findByRole("heading", { name: "Сессия не найдена" }),
    ).toBeInTheDocument();
  });
});
