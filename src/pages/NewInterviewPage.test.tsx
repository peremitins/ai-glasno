import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

function renderNewInterviewPage() {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/interview/new"]}>
        <AppRouter />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );
}

describe("NewInterviewPage", () => {
  it("собирает ручной контекст по профессии и выбранным тегам", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "Вручную" }));
    await user.type(
      screen.getByLabelText("Профессия или роль"),
      "Frontend-разработчик",
    );

    await user.click(
      await screen.findByRole("button", { name: /Frontend-разработчик/ }),
    );
    expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "React" }));
    expect(screen.getByRole("button", { name: /React ×/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("переключает форму на репетицию интервьюера", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("radio", { name: /Я провожу интервью/ }));

    expect(
      screen.getByRole("heading", { name: "Портрет кандидата" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Поведение кандидата" }),
    ).toBeInTheDocument();
  });

  it("не создаёт репетицию без вакансии", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("button", { name: "Начать репетицию" }));

    expect(
      await screen.findByText("Опишите вакансию не короче 10 символов"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "К чему готовимся" }),
    ).toBeInTheDocument();
  });

  it("создаёт сессию из единой формы и открывает её", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "Вручную" }));
    await user.type(
      screen.getByLabelText("Описание вакансии"),
      "Senior Frontend Developer",
    );
    await user.type(
      screen.getByLabelText("Коротко о себе"),
      "Разрабатываю приложения на React и TypeScript.",
    );
    await user.click(screen.getByRole("radio", { name: "Senior" }));
    await user.click(screen.getByRole("button", { name: "Начать репетицию" }));

    expect(
      await screen.findByRole("heading", { name: "Senior Frontend Developer" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/interview/session_03",
    );
  });

  it("создаёт сессию по ссылке на вакансию", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "По ссылке" }));
    await user.type(
      screen.getByLabelText("Ссылка на вакансию"),
      "https://hh.ru/vacancy/123456",
    );
    await user.type(
      screen.getByLabelText("Коротко о себе"),
      "Разрабатываю приложения на React и TypeScript.",
    );
    await user.click(screen.getByRole("button", { name: "Начать репетицию" }));

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/interview/session_03",
    );
  });

  it("создаёт сессию по выбранной роли без обязательного резюме", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "Вручную" }));
    await user.click(screen.getByLabelText("Профессия или роль"));
    await user.click(
      await screen.findByRole("button", { name: /Frontend-разработчик/ }),
    );
    await user.click(screen.getByRole("button", { name: "Начать репетицию" }));

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/interview/session_03",
    );
  });

  it("заполняет опыт извлечённым текстом резюме", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.upload(
      screen.getByLabelText("Загрузить резюме"),
      new File(["Опыт"], "resume.txt", { type: "text/plain" }),
    );

    expect(
      await screen.findByDisplayValue(
        "Разрабатываю интерфейсы на React и TypeScript.",
      ),
    ).toBeInTheDocument();
  });

  it("извлекает вопросы из прикреплённого файла", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    const input = screen.getByLabelText("Добавить файл с вопросами");
    const file = new File(["Расскажите о сложном проекте."], "questions.txt", {
      type: "text/plain",
    });

    await user.upload(input, file);

    expect(
      await screen.findByDisplayValue("Расскажите о сложном проекте."),
    ).toBeInTheDocument();
  });
});
