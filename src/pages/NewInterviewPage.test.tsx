import { Provider } from "react-redux";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";
import {
  type SpeechRecognitionInstance,
  type SpeechRecognitionWindow,
} from "@/shared/lib/speechRecognition";

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
  it("открывает список ролей по нажатию на поле", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "Вручную" }));
    await user.click(
      screen.getByRole("combobox", { name: "Профессия или роль" }),
    );

    expect(
      await screen.findByRole("option", { name: /Frontend-разработчик/ }),
    ).toBeVisible();
  });

  it("собирает ручной контекст по профессии и выбранным тегам", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("tab", { name: "Вручную" }));
    await user.type(
      screen.getByRole("combobox", { name: "Профессия или роль" }),
      "Frontend-разработчик",
    );

    await user.click(
      await screen.findByRole("option", { name: /Frontend-разработчик/ }),
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
    await user.click(
      screen.getByRole("combobox", { name: "Профессия или роль" }),
    );
    await user.click(
      await screen.findByRole("option", { name: /Frontend-разработчик/ }),
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

    expect(screen.getByLabelText("Коротко о себе")).toHaveValue("");
    expect(await screen.findByText("Предпросмотр резюме")).toBeInTheDocument();
    expect(
      screen.getByText("Разрабатываю интерфейсы на React и TypeScript."),
    ).toBeInTheDocument();
  });

  it("очищает свои вопросы через контрол VoiceTextarea", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.type(
      screen.getByLabelText("Свой план вопросов"),
      "Расскажите о сложном проекте",
    );
    await user.click(screen.getByRole("button", { name: "Очистить текст" }));

    expect(screen.getByLabelText("Свой план вопросов")).toHaveValue("");
  });

  it("добавляет распознанную речь в свои вопросы через микрофон", async () => {
    const user = userEvent.setup();
    const SpeechRecognition = class implements SpeechRecognitionInstance {
      static instance: SpeechRecognitionInstance | null = null;
      continuous = false;
      interimResults = false;
      lang = "";
      onend: (() => void) | null = null;
      onerror: ((event: { error?: string }) => void) | null = null;
      onresult: SpeechRecognitionInstance["onresult"] = null;
      start = vi.fn();
      stop = vi.fn(() => this.onend?.());

      constructor() {
        SpeechRecognition.instance = this;
      }
    };
    const speechWindow = window as Window & SpeechRecognitionWindow;
    const originalSpeechRecognition = speechWindow.SpeechRecognition;

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: SpeechRecognition,
    });

    try {
      renderNewInterviewPage();
      const questionsControl = screen.getByLabelText("Свой план вопросов");
      const questionsVoiceInput = within(questionsControl.parentElement!);
      await user.click(
        questionsVoiceInput.getByRole("button", {
          name: "Начать голосовой ввод",
        }),
      );

      expect(SpeechRecognition.instance).not.toBeNull();
      expect(SpeechRecognition.instance!.start).toHaveBeenCalledOnce();
      SpeechRecognition.instance!.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: "Расскажите о React" } }],
      } as never);

      await waitFor(() =>
        expect(screen.getByLabelText("Свой план вопросов")).toHaveValue(
          "Расскажите о React",
        ),
      );

      await user.click(
        questionsVoiceInput.getByRole("button", {
          name: "Остановить голосовой ввод",
        }),
      );
      expect(SpeechRecognition.instance!.stop).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        value: originalSpeechRecognition,
      });
    }
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
