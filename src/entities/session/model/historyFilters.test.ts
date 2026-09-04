import { describe, expect, it } from "vitest";

import {
  getSessionStatusFilter,
  setSessionStatusFilter,
} from "./historyFilters";

describe("фильтры истории сессий", () => {
  it("нормализует неизвестный статус к all", () => {
    expect(getSessionStatusFilter("archived")).toBe("all");
  });

  it("сохраняет остальные параметры URL при выборе статуса", () => {
    const searchParams = new URLSearchParams("source=dashboard&status=active");

    expect(setSessionStatusFilter(searchParams, "completed").toString()).toBe(
      "source=dashboard&status=completed",
    );
  });

  it("удаляет статус all из URL, сохраняя остальные параметры", () => {
    const searchParams = new URLSearchParams("source=dashboard&status=active");

    expect(setSessionStatusFilter(searchParams, "all").toString()).toBe(
      "source=dashboard",
    );
  });
});
