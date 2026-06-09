import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { HomeLanding } from "./HomeLanding";

describe("HomeLanding", () => {
  it("keeps the hero heading accessible name readable across title lines", () => {
    renderWithI18n(<HomeLanding />, { locale: "en" });

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Plan trips with friends easier and more fun",
    })).toBeInTheDocument();
  });
});
