import { expect } from "storybook/test";

export async function expectOwnerWorkspace({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectThaiOwnerWorkspace({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.ownerDocument.documentElement).toHaveAttribute("lang", "th");
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
}

export async function expectReadOnlyItineraryWorkspace({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".smart-table")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
  await expect(canvasElement.querySelector('button[aria-label^="Add stop"]')).toBeNull();
}

export async function expectDesktopOverviewWorkspace({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".workspace-grid")).toHaveClass("grid-cols-[minmax(0,1fr)]");
  await expect(canvasElement.querySelector(".side-rail")).toBeInTheDocument();
}

export async function expectWorkspaceView(
  canvasElement: HTMLElement,
  viewClassName: string,
) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".workspace-grid")).toHaveClass(
    "grid-cols-[minmax(0,1fr)]",
  );
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
  await expect(canvasElement.querySelector(viewClassName)).toBeInTheDocument();
}

export async function expectOverviewView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".overview-page");
}

export async function expectItineraryView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".table-panel");
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass(
    "overflow-x-auto",
  );
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass(
    "min-w-[520px]",
  );
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
}

export async function expectTimelineView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".timeline-panel");
  await expect(canvasElement.querySelector(".timeline-grid")).toBeInTheDocument();
}

export async function expectMapView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".route-map-panel");
  await expect(canvasElement.querySelector(".route-map-canvas")).toBeInTheDocument();
}

export async function expectMembersView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".members-page");
  await expect(canvasElement.querySelector(".member-command-bar")).toBeInTheDocument();
}

export async function expectExpensesView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".expenses-page");
  await expect(canvasElement.querySelector(".expense-finance-tabs")).toBeInTheDocument();
}

export async function expectBookingsView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".bookings-docs-page");
  await expect(canvasElement.querySelector(".bookings-content")).toBeInTheDocument();
}

export async function expectPhotosView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".trip-photos-page");
  await expect(canvasElement.querySelector(".photos-content")).toBeInTheDocument();
}

export async function expectSettingsView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expectWorkspaceView(canvasElement, ".trip-settings-page");
  await expect(canvasElement.querySelector("form[aria-label]")).toBeInTheDocument();
}

export async function expectBudgetView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectDreamerView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectFlexibleHunterView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectRouteBuilderView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectDetailPlannerView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectGroupWranglerView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}

export async function expectOnTripCompanionView({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  await expect(canvasElement.querySelector(".workspace-shell")).toBeInTheDocument();
  await expect(canvasElement.querySelector(".planning-main")).toBeInTheDocument();
}
