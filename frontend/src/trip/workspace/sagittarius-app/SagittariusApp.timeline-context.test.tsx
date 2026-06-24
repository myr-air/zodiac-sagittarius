import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit timeline context", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("keeps timeline selections separate from opening details", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="timeline" />);

    await user.click(
      within(screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).getByRole(
        "button",
        { name: /เลือกจุดในไทม์ไลน์ Victoria Peak/i },
      ),
    );
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();
  });
});
