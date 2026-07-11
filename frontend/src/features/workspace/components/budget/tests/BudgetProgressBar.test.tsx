import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetProgressBar } from "../BudgetProgressBar";

const matchMediaStub = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: matchMediaStub,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BudgetProgressBar", () => {
  it("renders the progress bar with correct fill width", () => {
    render(<BudgetProgressBar spent={400} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill).toBeInTheDocument();
    expect(fill.style.width).toBe("40%");
  });

  it("shows teal color when ratio <= 0.8", () => {
    render(<BudgetProgressBar spent={400} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.className).toContain("bg-(--color-primary)");
  });

  it("shows orange color when 0.8 < ratio <= 1.0", () => {
    render(<BudgetProgressBar spent={850} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.className).toContain("bg-(--color-warning)");
  });

  it("shows red color when ratio > 1.0", () => {
    render(<BudgetProgressBar spent={1200} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.className).toContain("bg-(--color-danger)");
  });

  it("shows teal at exactly 0.8 ratio", () => {
    render(<BudgetProgressBar spent={800} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.className).toContain("bg-(--color-primary)");
  });

  it("shows orange at 0.8001 ratio", () => {
    // 800.1 / 1000 = 0.8001
    render(<BudgetProgressBar spent={800.1} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.className).toContain("bg-(--color-warning)");
  });

  it("shows default label with tabular-nums", () => {
    render(<BudgetProgressBar spent={500} max={1000} />);
    const label = screen.getByTestId("progress-label");
    expect(label).toHaveTextContent("฿500 / ฿1,000");
    expect(label).toHaveClass("tabular-nums");
  });

  it("uses custom label when provided", () => {
    render(<BudgetProgressBar spent={500} max={1000} label="Under budget" />);
    const label = screen.getByTestId("progress-label");
    expect(label).toHaveTextContent("Under budget");
  });

  it("handles zero max gracefully", () => {
    render(<BudgetProgressBar spent={0} max={0} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill).toBeInTheDocument();
  });

  it("clamps negative spent to 0", () => {
    render(<BudgetProgressBar spent={-100} max={1000} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.style.width).toBe("0%");
  });
});
