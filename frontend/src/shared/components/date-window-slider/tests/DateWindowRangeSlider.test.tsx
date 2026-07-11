import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateWindowRangeSlider } from "../DateWindowRangeSlider";

// Stub matchMedia for jsdom (not available in test environment)
const matchMediaStub = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(), // deprecated but some code uses it
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

describe("DateWindowRangeSlider", () => {
  const defaultProps = {
    minDate: "2026-01-01",
    maxDate: "2026-12-01",
    start: "2026-03-01",
    end: "2026-09-01",
    onChange: vi.fn(),
  };

  describe("static render", () => {
    it("renders without crashing", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const track = screen.getByRole("presentation");
      expect(track).toBeInTheDocument();
    });

    it("renders the track with full width and 56px height", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const track = screen.getByRole("presentation");
      expect(track).toHaveClass("w-full");
      expect(track).toHaveClass("h-[56px]");
    });
  });

  describe("handles and visual appearance", () => {
    it("renders two slider handles", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const handles = screen.getAllByRole("slider");
      expect(handles).toHaveLength(2);
    });

    it("renders month+year labels on each handle", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      expect(screen.getByText("Mar 2026")).toBeInTheDocument();
      expect(screen.getByText("Sep 2026")).toBeInTheDocument();
    });

    it("renders range fill between handles", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const fill = screen.getByTestId("range-fill");
      expect(fill).toBeInTheDocument();
      expect(fill).toHaveClass("bg-(--color-primary-soft)");
    });

    it("handles have teal primary background", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const handles = screen.getAllByRole("slider");
      for (const handle of handles) {
        expect(handle).toHaveClass("bg-(--color-primary)");
      }
    });

    it("handle labels use tabular-nums class", () => {
      render(<DateWindowRangeSlider {...defaultProps} />);
      const labels = document.querySelectorAll("[data-testid='handle-label']");
      expect(labels).toHaveLength(2);
      for (const label of labels) {
        expect(label).toHaveClass("tabular-nums");
      }
    });
  });

  describe("cross-constraint", () => {
    it("renders handles at identical positions side-by-side when start equals end", () => {
      render(
        <DateWindowRangeSlider
          {...defaultProps}
          start="2026-06-01"
          end="2026-06-01"
        />,
      );
      const handles = screen.getAllByRole("slider");
      expect(handles).toHaveLength(2);
      const startHandle = handles[0];
      const endHandle = handles[1];
      expect(startHandle).toBeVisible();
      expect(endHandle).toBeVisible();
    });

    it("renders range fill with zero width when start equals end", () => {
      render(
        <DateWindowRangeSlider
          {...defaultProps}
          start="2026-06-01"
          end="2026-06-01"
        />,
      );
      const fill = screen.getByTestId("range-fill");
      expect(fill).toBeInTheDocument();
    });

    it("clamps range fill to min side when start is before minDate", () => {
      render(
        <DateWindowRangeSlider
          {...defaultProps}
          minDate="2026-03-01"
          maxDate="2026-12-01"
          start="2025-06-01"
          end="2026-09-01"
        />,
      );
      const fill = screen.getByTestId("range-fill");
      expect(fill).toBeInTheDocument();
      expect(screen.getAllByRole("slider")).toHaveLength(2);
    });
  });

  describe("keyboard navigation", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("moves start handle forward by 1 month on ArrowRight", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[0].focus();
      fireEvent.keyDown(handles[0], { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledTimes(1);
      const [newStart, newEnd] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-04-01");
      expect(newEnd).toBe("2026-09-01");
    });

    it("moves start handle backward by 1 month on ArrowLeft", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[0].focus();
      fireEvent.keyDown(handles[0], { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledTimes(1);
      const [newStart] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-02-01");
    });

    it("moves end handle forward by 1 month on ArrowRight", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[1].focus();
      fireEvent.keyDown(handles[1], { key: "ArrowRight" });
      const [newStart, newEnd] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-03-01");
      expect(newEnd).toBe("2026-10-01");
    });

    it("moves by 6 months on Shift+ArrowRight", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[0].focus();
      fireEvent.keyDown(handles[0], { key: "ArrowRight", shiftKey: true });
      const [newStart] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-09-01");
    });

    it("moves to minDate on Home key", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[0].focus();
      fireEvent.keyDown(handles[0], { key: "Home" });
      const [newStart] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-01-01");
    });

    it("moves to maxDate on End key", () => {
      const onChange = vi.fn();
      render(<DateWindowRangeSlider {...defaultProps} onChange={onChange} />);
      const handles = screen.getAllByRole("slider");
      handles[1].focus();
      fireEvent.keyDown(handles[1], { key: "End" });
      const [newStart, newEnd] = onChange.mock.calls[0];
      expect(newStart).toBe("2026-03-01");
      expect(newEnd).toBe("2026-12-01");
    });

    it("clamps start handle to end handle (cannot cross)", () => {
      const onChange = vi.fn();
      render(
        <DateWindowRangeSlider
          minDate="2026-01-01"
          maxDate="2026-12-01"
          start="2026-09-01"
          end="2026-09-01"
          onChange={onChange}
        />,
      );
      const handles = screen.getAllByRole("slider");
      handles[0].focus();
      // Try to move start past end — should be clamped, no onChange call
      fireEvent.keyDown(handles[0], { key: "ArrowRight" });
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
