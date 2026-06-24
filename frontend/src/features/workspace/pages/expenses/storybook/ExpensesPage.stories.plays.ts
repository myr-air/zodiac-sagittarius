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

export const viewerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Money view only/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Add spend/i })).toBeDisabled();
};

export const ownerThaiPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("region", { name: /สรุปเงิน/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เพิ่มรายการ/i })).toBeEnabled();
};

export const addExpenseDialogOpenPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add spend/i }));
  await expect(canvas.getByRole("dialog", { name: /Add expense/i })).toHaveClass("expense-dialog");
  await expect(canvas.getByLabelText("Expense title")).toBeVisible();
  await expect(canvas.getByLabelText("Amount")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save expense/i })).toBeDisabled();
};

export const filteredLedgerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Spending/i }));
  const ledger = canvas.getByRole("table", { name: /Spending log/i });
  await expect(ledger).toHaveClass("expense-ledger-table");

  await userEvent.type(canvas.getByLabelText(/Find spend/i), "tram");
  await expect(canvas.getByRole("heading", { name: "Peak Tram tickets" })).toBeVisible();
  await expect(canvas.queryByRole("heading", { name: "Dim Dim Sum brunch" })).toBeNull();

  await userEvent.click(canvas.getByRole("button", { name: /Filters/i }));
  await userEvent.selectOptions(canvas.getByLabelText("Category"), "transport");
  await expect(canvas.getByText(/No expenses match this filter/i)).toBeVisible();

  await userEvent.click(canvas.getByRole("button", { name: /Clear filters/i }));
  await expect(canvas.getByRole("heading", { name: "Dim Dim Sum brunch" })).toBeVisible();
  await expect(within(ledger).getByText("Octopus top-up")).toBeVisible();
  await expect(canvas.getByRole("region", { name: "Dim Dim Sum brunch" })).toHaveClass("expense-transaction-detail");
};

export const planScopeAuditPlay: ExpensesPagePlay = async ({ canvas }) => {
  onStoryUpdateExpense.mockClear();
  await userEvent.click(canvas.getByRole("tab", { name: /Categories/i }));
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

export const settingsTabPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: /Tools/i }));
  await expect(canvas.getByRole("region", { name: /Tools/i })).toBeVisible();
  await expect(canvas.getByLabelText(/Display currency/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Export/i })).toBeVisible();
};
