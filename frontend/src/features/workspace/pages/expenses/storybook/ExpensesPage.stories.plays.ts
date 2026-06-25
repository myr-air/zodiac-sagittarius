import type { StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { TripExpensesPage } from "../TripExpensesPage";
import {
  expectExpensesResponsiveContract,
  onStoryUpdateExpense,
} from "./ExpensesPage.stories.support";

type ExpensesPagePlay = NonNullable<StoryObj<typeof TripExpensesPage>["play"]>;

export const ownerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Trip money/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("button", { name: /Add spend/i })).toBeEnabled();
  await expect(canvas.getByRole("tablist", { name: /Trip money sections/i })).toHaveClass("expense-finance-tabs");
};

export const travelerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Can add spend/i)).toBeVisible();
  await expect(canvas.getByRole("region", { name: /Add recent spend/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Quick add/i })).toBeDisabled();
  await expect(canvas.queryByRole("button", { name: /Record payback|Close statement/i })).toBeNull();
};

export const viewerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Money view only/i)).toBeVisible();
  await expect(canvas.queryByRole("button", { name: /Add spend|Quick add/i })).toBeNull();
};

export const ownerThaiPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("region", { name: /สรุปเงิน/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เพิ่มรายการ/i })).toBeEnabled();
};

export const addExpenseDialogOpenPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add spend/i }));
  const dialog = canvas.getByRole("dialog", { name: /Add expense/i });
  await expect(dialog).toHaveClass("expense-dialog");
  await expect(within(dialog).getByLabelText("Expense title")).toBeVisible();
  await expect(within(dialog).getByLabelText("Amount")).toBeVisible();
  await expect(within(dialog).getByRole("button", { name: /Save expense/i })).toBeDisabled();
};

export const filteredLedgerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Manage expenses/i }));
  const ledger = canvas.getByRole("table", { name: /Spending log/i });
  await expect(ledger).toHaveClass("expense-ledger-table");

  await userEvent.type(canvas.getByLabelText(/Find spend/i), "tram");
  await expect(within(ledger).getAllByRole("button", { name: /Peak Tram tickets/i })[0]).toBeVisible();
  await expect(within(ledger).queryByRole("button", { name: /Dim Dim Sum brunch/i })).toBeNull();

  await userEvent.click(canvas.getByRole("button", { name: /Filters/i }));
  await userEvent.selectOptions(within(canvas.getByRole("tabpanel", { name: /Manage expenses/i })).getByLabelText("Category"), "transport");
  await expect(canvas.getByText(/No expenses match this filter/i)).toBeVisible();

  await userEvent.click(canvas.getByRole("button", { name: /Clear filters/i }));
  await userEvent.click(within(ledger).getAllByRole("button", { name: /Dim Dim Sum brunch/i })[0]);
  await expect(within(ledger).getByText("Octopus top-up")).toBeVisible();
  await expect(within(ledger).getByText("Receipt details")).toBeVisible();
};

export const planScopeAuditPlay: ExpensesPagePlay = async ({ canvas }) => {
  onStoryUpdateExpense.mockClear();
  const audit = canvas.getByRole("region", { name: /Plan scope audit/i });
  await expect(audit).toHaveTextContent("Dim Dim Sum brunch");
  await expect(audit).toHaveTextContent("Inferred scope: แผนฝนตก");

  await userEvent.click(
    within(audit).getByRole("button", {
      name: /Review scope for Dim Dim Sum brunch/i,
    }),
  );
  const dialog = canvas.getByRole("dialog", { name: /Edit expense/i });
  await expect(within(dialog).getByLabelText("Trip Plan")).toHaveValue("plan-rain");
};

export const responsivePlay: ExpensesPagePlay = async ({ canvasElement }) => {
  await expectExpensesResponsiveContract(canvasElement);
};

export const mobileEditDialogLayerPlay: ExpensesPagePlay = async ({ canvas, canvasElement }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Manage expenses/i }));
  const mobileLedger = canvasElement.querySelector(".expense-mobile-ledger");
  await expect(mobileLedger).not.toBeNull();
  const firstMobileExpense = mobileLedger?.querySelector("button");
  await expect(firstMobileExpense).not.toBeNull();
  if (!firstMobileExpense) return;

  await userEvent.click(firstMobileExpense);
  const detail = canvas.getByRole("dialog");
  await expect(detail).toHaveClass("expense-transaction-detail");
  await userEvent.click(within(detail).getByRole("button", { name: /Edit /i }));

  const editDialog = canvas.getByRole("dialog", { name: /Edit expense/i });
  await expect(editDialog).toBeVisible();
  const bounds = editDialog.getBoundingClientRect();
  const topElement = document.elementFromPoint(
    bounds.left + bounds.width / 2,
    Math.min(bounds.top + bounds.height / 2, window.innerHeight / 2),
  );
  expect(topElement?.closest(".expense-transaction-detail")).toBeNull();
};

export const settingsTabPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Tools/i }));
  await expect(canvas.getByRole("region", { name: /Tools/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Display currency/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Export/i })).toBeVisible();
};

export const accountMobilePlay: ExpensesPagePlay = async ({ canvas, canvasElement }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Statement|รายการบัญชี/i }));
  await expect(canvasElement.querySelector(".expense-statement")).not.toBeNull();
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
};

export const itemizedHeavyDialogPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Manage expenses|จัดการค่าใช้จ่าย/i }));
  await userEvent.click(canvas.getByRole("button", { name: /Night market itemized receipt/i }));
  const detail = canvas.getByRole("dialog", { name: /Night market itemized receipt/i });
  await userEvent.click(within(detail).getByRole("button", { name: /Edit|แก้ไข/i }));
  const dialog = canvas.getByRole("dialog", { name: /Edit expense|แก้ไขค่าใช้จ่าย/i });
  await userEvent.click(within(dialog).getByRole("button", { name: /Itemized receipt|แยกรายการ/i }));
  await expect(within(dialog).getByRole("group", { name: /Line item 1|รายการ 1/i })).toBeVisible();
  await expect(within(dialog).getAllByText(/Nattaporn Sirirattanakul/i)[0]).toBeVisible();
};
