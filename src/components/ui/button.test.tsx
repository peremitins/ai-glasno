import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("отображает переданный текст", () => {
    render(<Button>Продолжить</Button>);

    expect(
      screen.getByRole("button", { name: "Продолжить" }),
    ).toBeInTheDocument();
  });
});
