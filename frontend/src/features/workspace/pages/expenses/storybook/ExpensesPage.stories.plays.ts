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
  await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeEnabled();
};

export const viewerPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Money view only/i)).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Add expense/i })).toBeDisabled();
};

export const ownerThaiPlay: ExpensesPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("region", { name: /สรุปเงิน/i })).toBeVisible();
  await expect(canvas.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i })).toBeEnabled();
};

export const addExpenseDialogOpenPlay: ExpensesPagePlay = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Add expense/i }));
  await expect(canvas.getByRole("dialog", { name: /Add expense/i })).toHaveClass("expense-dialog");
  await expect(canvas.getByLabelText("Expense title")).toBeVisible();
  await expect(canvas.getByLabelText("Amount")).toBeVisible();
  await expect(canvas.getByRole("button", { name: /Save expense/i })).toBeDisabled();
};

export const filteredLedgerPlay: ExpensesPagePlay = async ({ canvas }) => {
  const ledger = canvas.getByRole("table", { name: /Expense ledger/i });
  await expect(ledger).toHaveClass("expense-ledger-table");

  await userEvent.type(canvas.getByLabelText(/Search expenses/i), "tram");
  await expect(canvas.getByText("Peak Tram tickets")).toBeVisible();
  await expect(canvas.queryByText("Dim Dim Sum brunch")).toBeNull();

  await userEvent.selectOptions(canvas.getByLabelText("Category"), "transport");
  await expect(canvas.getByText(/No expenses match this filter/i)).toBeVisible();

  await userEvent.click(canvas.getByRole("button", { name: /Clear filters/i }));
  await expect(canvas.getByText("Dim Dim Sum brunch")).toBeVisible();
  await expect(canvas.getByText("Octopus top-up")).toBeVisible();
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
