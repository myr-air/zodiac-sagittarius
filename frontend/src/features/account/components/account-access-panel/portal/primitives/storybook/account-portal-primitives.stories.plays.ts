import { expect, within } from "storybook/test";

type PortalPrimitivesPlayContext = {
  canvasElement: HTMLElement;
};

export const overviewPlay = async ({ canvasElement }: PortalPrimitivesPlayContext) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByLabelText("Portal navigation")).toHaveClass("portal-nav");
  await expect(canvas.getByRole("link", { name: /Dashboard/i })).toHaveClass("portal-nav-link--active");
  await expect(canvas.getByText("Portal dashboard").closest(".account-panel-heading")).toHaveClass("flex");
  await expect(canvas.getByText("Trips").closest(".account-stat")).toHaveClass("grid");
  await expect(canvasElement.querySelector(".portal-skeleton-card")).toHaveClass("account-stat");
  await expect(canvas.getByText("Hong Kong Sprint").closest(".account-trip-row")).toHaveClass("flex");
  await expect(canvasElement.querySelector(".portal-list-skeleton")).toHaveClass("grid");
  await expect(canvas.getByText("Trusted devices").closest(".account-setting-line")).toHaveClass("grid");
  await expect(canvas.getByText("No trips yet").closest(".portal-empty-state")).toHaveClass("grid");
};
