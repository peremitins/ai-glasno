import { Provider } from "react-redux";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";
import { API_BASE_URL } from "@/shared/api/baseApi";
import { server } from "@/test/server";

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
      screen.getByRole("button", { name: "Открыть подсказки" }),
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

  it("помечает рабочую область классом с открытыми боковыми панелями", async () => {
    const user = userEvent.setup();
    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });
    await user.click(screen.getByRole("button", { name: "Открыть подсказки" }));

    expect(document.querySelector(".call--side")).toBeInTheDocument();
  });

  it("показывает историю и поле ответа внутри бокового чата", async () => {
    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });

    const chat = screen.getByRole("complementary", { name: "Чат" });
    expect(
      within(chat).getByText(
        "Начнём с TypeScript. Ответьте развёрнуто и приведите пример.",
      ),
    ).toBeInTheDocument();
    expect(within(chat).getByLabelText("Ваш ответ")).toBeInTheDocument();
  });

  it("оставляет текстовый режим доступным, если realtime voice не поддержан", async () => {
    const user = userEvent.setup();
    renderInterviewPage();

    await screen.findByRole("heading", { name: "Практика TypeScript" });
    await user.click(
      screen.getByRole("button", {
        name: "Начать разговор в реальном времени",
      }),
    );

    expect(
      await screen.findByText(
        "Браузер не поддерживает голосовой режим в реальном времени.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ваш ответ")).toBeEnabled();
  });

  it("показывает поток камеры в preview после появления video-элемента", async () => {
    const user = userEvent.setup();
    const stream = {
      getTracks: () => [],
      getVideoTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const mediaDevices = navigator.mediaDevices;
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    try {
      renderInterviewPage();
      await screen.findByRole("heading", { name: "Практика TypeScript" });

      await user.click(screen.getByRole("button", { name: "Включить камеру" }));

      const preview = await waitFor(() => {
        const video =
          document.querySelector<HTMLVideoElement>("video.camera-video");
        expect(video).not.toBeNull();
        return video;
      });
      expect(preview?.srcObject).toBe(stream);
    } finally {
      play.mockRestore();
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: mediaDevices,
      });
    }
  });

  it("возвращает интерфейс камеры в безопасное состояние после потери видеопотока", async () => {
    const user = userEvent.setup();
    const listeners = new Map<string, () => void>();
    const track = {
      addEventListener: (_event: string, listener: () => void) => {
        listeners.set(_event, listener);
      },
      stop: vi.fn(),
    } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
    const mediaDevices = navigator.mediaDevices;
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    });

    try {
      renderInterviewPage();
      await screen.findByRole("heading", { name: "Практика TypeScript" });
      await user.click(screen.getByRole("button", { name: "Включить камеру" }));
      expect(await screen.findByText("Камера включена")).toBeInTheDocument();

      listeners.get("ended")?.();

      expect(await screen.findByText("Камера выключена")).toBeInTheDocument();
    } finally {
      play.mockRestore();
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: mediaDevices,
      });
    }
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

  it("показывает причину отказа в доступе вместо сообщения о несуществующей сессии", async () => {
    server.use(
      http.get(`${API_BASE_URL}/sessions/forbidden`, () =>
        HttpResponse.json(
          { code: "E_FORBIDDEN", message: "Нет доступа к этому интервью" },
          { status: 403 },
        ),
      ),
    );

    renderInterviewPage("/interview/forbidden");

    expect(
      await screen.findByRole("heading", { name: "Не удалось открыть сессию" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Нет доступа к этому интервью"),
    ).toBeInTheDocument();
  });
});
