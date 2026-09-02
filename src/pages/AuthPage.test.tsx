import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";

import { AuthPage } from "./AuthPage";

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

function renderAuthPage(initialEntry = "/auth") {
  const store = createAppStore();

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/profile"
            element={
              <>
                <h1>Профиль</h1>
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("AuthPage", () => {
  it("показывает ошибку для некорректного e-mail", async () => {
    const user = userEvent.setup();

    renderAuthPage();
    await user.type(screen.getByLabelText("E-mail"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Получить код" }));

    expect(
      await screen.findByText("Введите корректный e-mail"),
    ).toBeInTheDocument();
  });

  it("показывает код, таймеры и позволяет сменить e-mail", async () => {
    const user = userEvent.setup();

    renderAuthPage();
    await user.type(screen.getByLabelText("E-mail"), "nikolay@example.com");
    await user.click(screen.getByRole("button", { name: "Получить код" }));

    expect(
      await screen.findByRole("heading", { name: "Подтвердите e-mail" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Код действует 10:00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Отправить повторно через 60 с" }),
    ).toBeDisabled();
    expect(screen.getByText("Код для разработки: 123456")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Изменить e-mail" }));

    expect(screen.getByRole("heading", { name: "Вход" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveValue("nikolay@example.com");
  });

  it("выполняет вход по коду и безопасно возвращает на исходный маршрут", async () => {
    const user = userEvent.setup();

    renderAuthPage("/auth?next=%2Fprofile");
    await user.type(screen.getByLabelText("E-mail"), "nikolay@example.com");
    await user.click(screen.getByRole("button", { name: "Получить код" }));

    await user.type(screen.getByLabelText("Код из письма"), "12a3456");
    expect(screen.getByLabelText("Код из письма")).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(
      await screen.findByRole("heading", { name: "Профиль" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/profile");
  });
});
