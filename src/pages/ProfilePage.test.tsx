import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";
import { setUser } from "@/features/auth/model/authSlice";

function renderProfile(isAuthenticated = false) {
  const store = createAppStore();

  if (isAuthenticated) {
    store.dispatch(
      setUser({
        id: "user_01",
        email: "nikolay@example.com",
        displayName: "Николай",
      }),
    );
  }

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/profile"]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProfilePage", () => {
  it("перенаправляет неавторизованного пользователя на вход", () => {
    renderProfile();

    expect(screen.getByRole("heading", { name: "Вход" })).toBeInTheDocument();
  });

  it("загружает и сохраняет данные профиля", async () => {
    const user = userEvent.setup();
    renderProfile(true);

    expect(
      await screen.findByRole("heading", { name: "Профиль" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toHaveValue("Николай");

    await user.clear(screen.getByLabelText("Имя"));
    await user.type(screen.getByLabelText("Имя"), "Николай Перемитин");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Профиль сохранён.",
    );
    expect(screen.getByLabelText("Имя")).toHaveValue("Николай Перемитин");
  });
});
