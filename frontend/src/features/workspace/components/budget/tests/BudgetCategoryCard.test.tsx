import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetCategoryCard } from "../BudgetCategoryCard";
import type { BudgetCategory } from "@/src/trip/types";

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

const sampleCategory: BudgetCategory = {
  id: "cat-1",
  tripId: "trip-1",
  category: "Flights",
  estimated: 5000,
  actual: 3200,
};

describe("BudgetCategoryCard", () => {
  it("renders category name and amounts", () => {
    render(<BudgetCategoryCard category={sampleCategory} onEdit={vi.fn()} />);
    expect(screen.getByText("Flights")).toBeInTheDocument();
    expect(screen.getByTestId("allocated-label")).toHaveTextContent("Allocated: ฿5,000");
    expect(screen.getByTestId("spent-label")).toHaveTextContent("Spent: ฿3,200");
  });

  it("renders progress bar", () => {
    render(<BudgetCategoryCard category={sampleCategory} onEdit={vi.fn()} />);
    expect(screen.getByTestId("progress-fill")).toBeInTheDocument();
  });

  it("has an edit button", () => {
    render(<BudgetCategoryCard category={sampleCategory} onEdit={vi.fn()} />);
    expect(screen.getByTestId("edit-budget-button")).toBeInTheDocument();
  });

  it("enters inline edit mode on edit button click", () => {
    render(<BudgetCategoryCard category={sampleCategory} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByTestId("edit-budget-button"));
    // Input should appear
    expect(screen.getByTestId("budget-edit-input")).toBeInTheDocument();
    expect(screen.getByTestId("budget-edit-input")).toHaveValue(5000);
  });

  it("saves on Enter and calls onEdit", () => {
    const onEdit = vi.fn();
    render(<BudgetCategoryCard category={sampleCategory} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId("edit-budget-button"));
    const input = screen.getByTestId("budget-edit-input");
    fireEvent.change(input, { target: { value: "6000" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onEdit).toHaveBeenCalledWith("cat-1", { estimated: 6000 });
  });

  it("cancels on Escape without calling onEdit", () => {
    const onEdit = vi.fn();
    render(<BudgetCategoryCard category={sampleCategory} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId("edit-budget-button"));
    fireEvent.keyDown(screen.getByTestId("budget-edit-input"), { key: "Escape" });
    expect(onEdit).not.toHaveBeenCalled();
    // Input should be gone
    expect(screen.queryByTestId("budget-edit-input")).not.toBeInTheDocument();
  });

  it("renders icon when iconName is provided", () => {
    render(<BudgetCategoryCard category={sampleCategory} onEdit={vi.fn()} iconName="plane" />);
    expect(screen.getByTestId("category-icon")).toHaveTextContent("plane");
  });
});
