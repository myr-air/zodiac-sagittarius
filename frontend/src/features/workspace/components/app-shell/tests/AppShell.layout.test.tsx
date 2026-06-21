import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { renderAppShell } from "../testing/support/render-app-shell";

describe("AppShell layout", () => {
  it("owns the workspace grid and side rail responsive classes", async () => {
    const { container } = renderAppShell();

    await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(container.querySelector(".app-layout")).toHaveClass(
      "grid",
      "grid-cols-[236px_minmax(0,1fr)]",
      "data-[sidebar-collapsed=true]:grid-cols-[74px_minmax(0,1fr)]",
      "max-[767px]:block",
      "max-[767px]:max-w-[100vw]",
      "max-[767px]:overflow-x-hidden",
    );
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toHaveClass(
      "side-rail",
      "sticky",
      "grid-rows-[70px_1fr_auto_auto]",
      "data-[collapsed=true]:grid-rows-[84px_1fr_auto_auto]",
      "max-[1199px]:grid-rows-[70px_1fr_auto_auto]",
      "max-[767px]:sticky",
      "max-[767px]:z-40",
      "max-[767px]:grid-rows-[auto]",
    );
    expect(container.querySelector(".brand-row")).toHaveClass(
      "w-full",
      "box-border",
      "data-[collapsed=true]:flex-col",
      "data-[collapsed=true]:justify-center",
      "max-[1199px]:justify-center",
      "max-[767px]:min-h-12",
      "max-[767px]:grid",
      "max-[767px]:grid-cols-[minmax(64px,auto)_minmax(0,1fr)_44px]",
    );
    expect(container.querySelector(".rail-toggle")).toHaveClass(
      "data-[collapsed=true]:min-h-7",
      "data-[collapsed=true]:w-7",
      "max-[1199px]:hidden",
    );
    expect(screen.getByText(seedTrip.name)).toHaveClass("hidden");
    expect(container.querySelector(".mobile-page-title")).toHaveTextContent("ภาพรวม");
    expect(container.querySelector(".mobile-page-title")).toHaveClass("max-[767px]:block");
    expect(screen.getByRole("button", { name: "เปิดเมนู" })).toHaveClass("mobile-menu-button", "max-[767px]:inline-flex");
    expect(container.querySelector(".rail-links")).toHaveClass(
      "w-full",
      "box-border",
      "overflow-x-hidden",
      "data-[collapsed=true]:px-1.5",
      "max-[1199px]:px-1.5",
      "max-[767px]:fixed",
      "max-[767px]:top-12",
      "max-[767px]:data-[mobile-open=false]:opacity-0",
      "max-[767px]:data-[mobile-open=true]:opacity-100",
    );
    expect(container.querySelector(".rail-link")).toHaveClass(
      "max-[767px]:min-h-11",
      "max-[767px]:w-full",
    );
  });

  it("opens mobile navigation from the merged top header", async () => {
    const user = userEvent.setup();
    renderAppShell({ activeView: "bookings", locale: "en" });

    expect(document.querySelector(".mobile-page-title")).toHaveTextContent("Bookings & Docs");
    const menu = document.querySelector(".rail-links");
    expect(menu).toHaveAttribute("data-mobile-open", "false");

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(menu).toHaveAttribute("data-mobile-open", "true");
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the active mobile navigation item centered when the view changes", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const firstRender = renderAppShell();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" }));
    scrollIntoView.mockClear();
    firstRender.unmount();

    renderAppShell({ activeView: "photos" });

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" }));
    expect(screen.getByRole("link", { name: /รูปภาพ/i })).toHaveAttribute("data-active", "true");
  });
});
