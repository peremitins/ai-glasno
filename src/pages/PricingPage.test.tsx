import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppRouter from "@/app/AppRouter";
import { createAppStore } from "@/app/store";

describe("PricingPage", () => {
  it("открывает страницу тарифов вместо страницы 404", () => {
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter initialEntries={["/pricing"]}>
          <AppRouter />
        </MemoryRouter>
      </Provider>,
    );

    expect(
      screen.getByRole("heading", { name: "Полный доступ" }),
    ).toBeInTheDocument();
  });

  it("пересчитывает стоимость при выборе срока доступа", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter initialEntries={["/pricing"]}>
          <AppRouter />
        </MemoryRouter>
      </Provider>,
    );

    await user.click(screen.getByRole("radio", { name: /7\s*дней/i }));

    expect(screen.getByText("449 ₽")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Оплатить 449 ₽" }),
    ).toBeEnabled();
  });
});
