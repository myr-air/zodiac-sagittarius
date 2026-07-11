import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { InlineImportArea } from "../InlineImportArea";
import { renderWithI18n } from "@/src/i18n/test-utils";

const render = (ui: React.ReactElement) => renderWithI18n(ui, { locale: "en" });

const joinRow = (...cells: string[]) => cells.join("\t");

const headerRow = joinRow("Date", "Activity", "Time", "Notes");

function makeValidData(rows: string[][]) {
  return [headerRow, ...rows.map((row) => joinRow(...row))].join("\n");
}

const singleRowData = makeValidData([
  ["2025-03-01", "Breakfast at Wat Pho", "09:00", "Bring camera"],
]);

const multiRowData = makeValidData([
  ["2025-03-01", "Breakfast at Wat Pho", "09:00", "Bring camera"],
  ["2025-03-02", "Lunch at Siam Paragon", "14:00", ""],
]);

const fourRowData = makeValidData([
  ["2025-03-01", "Breakfast at Wat Pho", "09:00", "Bring camera"],
  ["2025-03-02", "Lunch at Siam Paragon", "14:00", ""],
  ["2025-03-03", "Museum visit", "10:00", "Book tickets"],
  ["2025-03-04", "Dinner at Sky Bar", "19:00", ""],
]);

const invalidData = "this is not a valid itinerary import";

describe("InlineImportArea", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders textarea with placeholder", () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    expect(
      screen.getByPlaceholderText("Paste CSV or tab-separated data here..."),
    ).toBeInTheDocument();
  });

  it("shows disabled Apply button when textarea is empty", () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const applyButton = screen.getByRole("button", { name: "Convert" });
    expect(applyButton).toBeDisabled();
  });

  it("parses valid CSV/TSV input and shows preview rows", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: multiRowData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Breakfast at Wat Pho")).toBeInTheDocument();
    });

    expect(screen.getByText("Lunch at Siam Paragon")).toBeInTheDocument();
    expect(screen.getByText("2025-03-01")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("shows parse error for invalid input", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: invalidData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Import file must be valid JSON or a CSV\/TSV table/),
    ).toBeInTheDocument();
  });

  it("calls onApply with text when Apply is clicked", async () => {
    const onApply = vi.fn();
    render(<InlineImportArea onApply={onApply} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: multiRowData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Breakfast at Wat Pho")).toBeInTheDocument();
    });

    const applyButton = screen.getByRole("button", { name: "Convert" });
    expect(applyButton).toBeEnabled();

    fireEvent.click(applyButton);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(multiRowData);
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<InlineImportArea onApply={vi.fn()} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows 'No data detected' for whitespace-only input", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: "   \n\t  " } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("No data detected")).toBeInTheDocument();
    });
  });

  it("shows '+N more rows' badge when more than 3 items", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: fourRowData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("+1 more rows")).toBeInTheDocument();
    });

    expect(screen.getByText("Preview (4 items)")).toBeInTheDocument();
  });

  it("handles single row parsable data", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: singleRowData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Breakfast at Wat Pho")).toBeInTheDocument();
    });

    expect(screen.queryByText(/more rows/)).not.toBeInTheDocument();
  });

  it("shows empty preview when text is cleared", async () => {
    render(<InlineImportArea onApply={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(
      "Paste CSV or tab-separated data here...",
    );

    fireEvent.change(textarea, { target: { value: singleRowData } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText("Breakfast at Wat Pho")).toBeInTheDocument();
    });

    fireEvent.change(textarea, { target: { value: "" } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.queryByText("Breakfast at Wat Pho")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("No data detected")).not.toBeInTheDocument();
  });
});
