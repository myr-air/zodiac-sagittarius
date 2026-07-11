import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { InviteDialog } from "../InviteDialog";

vi.mock("qrcode", () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("InviteDialog", () => {
  const baseProps = {
    inviteUrl: "https://joii.app/invite/xyz",
    onClose: vi.fn(),
    onCopyLink: vi.fn(),
    copied: false,
    closeAriaLabel: "Close",
    copyLinkLabel: "Copy link",
    copyLinkSuccess: "Link copied",
    qrLabel: "QR Code",
    inviteDialogTitle: "Invite Members",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders when open is true", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    expect(screen.getByRole("dialog", { name: "Invite Members" })).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={false} />, { locale: "en" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows invite URL in read-only input", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    const input = screen.getByDisplayValue("https://joii.app/invite/xyz");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("readonly");
  });

  it("shows QR code canvas", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    const canvas = screen.getByLabelText("QR Code");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("copy button copies URL to clipboard", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(baseProps.onCopyLink).toHaveBeenCalledTimes(1);
  });

  it("close button calls onClose", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("escape key calls onClose", () => {
    renderWithI18n(<InviteDialog {...baseProps} open={true} />, { locale: "en" });

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
