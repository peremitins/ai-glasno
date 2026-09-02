import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/app/store";

import { AuthPage } from "./AuthPage";

function renderAuthPage() {
  const store = createAppStore();

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<h1>Профиль</h1>} />
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

  it("выполняет passwordless-вход по коду и открывает профиль", async () => {
    const user = userEvent.setup();

    renderAuthPage();
    await user.type(screen.getByLabelText("E-mail"), "nikolay@example.com");
    await user.click(screen.getByRole("button", { name: "Получить код" }));

    expect(
      await screen.findByRole("heading", { name: "Подтвердите e-mail" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Код из письма"), "123456");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(
      await screen.findByRole("heading", { name: "Профиль" }),
    ).toBeInTheDocument();
  });
});
