import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { TripMembersPage } from "./TripMembersPage";
import { expectMembersResponsiveContract } from "./MembersPage.stories.support";

type MembersPagePlay = NonNullable<StoryObj<typeof TripMembersPage>["play"]>;

export const ownerPlay: MembersPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip members/i })).toHaveClass("members-page");
  await expect(canvas.getByRole("button", { name: /Copy invite/i })).toBeEnabled();
  await expect(canvas.getByRole("button", { name: /Open add-member form/i })).toBeEnabled();
};

export const ownerThaiPlay: MembersPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page");
  await expect(canvas.getByText("สมาชิกในทริป")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeVisible();
};

export const readOnlyPlay: MembersPagePlay = async ({ canvas }) => {
  await expect(canvas.queryByRole("button", { name: /copy invite|คัดลอกลิงก์เชิญ/i })).not.toBeInTheDocument();
  await expect(canvas.queryByRole("button", { name: /add member|เปิดฟอร์มเพิ่มสมาชิก/i })).not.toBeInTheDocument();
  await expect(canvas.getByRole("status")).toHaveTextContent(/read only|อ่านอย่างเดียว/i);
};

export const responsivePlay: MembersPagePlay = async ({ canvasElement }) => {
  await expectMembersResponsiveContract(canvasElement);
};

export const mobilePlay: MembersPagePlay = async ({ canvas, canvasElement }) => {
  await expectMembersResponsiveContract(canvasElement);
  await expect(canvas.getByRole("button", { name: /Copy invite|คัดลอกลิงก์เชิญ/i })).toBeVisible();
};
