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
  it("не позволяет перейти к следующему шагу без вакансии", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.click(screen.getByRole("button", { name: "Далее" }));

    expect(
      await screen.findByText("Опишите вакансию не короче 10 символов"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Вакансия" })).toBeInTheDocument();
  });

  it("создаёт сессию после заполнения всех шагов и открывает её", async () => {
    const user = userEvent.setup();

    renderNewInterviewPage();
    await user.type(
      screen.getByLabelText("Вакансия"),
      "Senior Frontend Developer",
    );
    await user.click(screen.getByRole("button", { name: "Далее" }));

    await user.type(
      screen.getByLabelText("Профиль кандидата"),
      "Разрабатываю приложения на React и TypeScript.",
    );
    await user.click(screen.getByRole("button", { name: "Далее" }));

    await user.selectOptions(screen.getByLabelText("Уровень"), "senior");
    await user.selectOptions(screen.getByLabelText("Формат"), "technical");
    await user.click(screen.getByRole("button", { name: "Далее" }));

    await user.selectOptions(screen.getByLabelText("Количество вопросов"), "10");
    await user.selectOptions(screen.getByLabelText("Длительность, минут"), "45");
    await user.click(screen.getByRole("button", { name: "Создать сессию" }));

    expect(await screen.findByRole("heading", { name: "Сессия" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/interview/session_03");
  });
});
