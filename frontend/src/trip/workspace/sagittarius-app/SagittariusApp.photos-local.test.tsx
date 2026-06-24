import {
  fireEvent,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit local photos", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("opens the Photos workspace and creates a local album link", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="photos" />);

    expect(
      screen.getByRole("region", { name: /Photos & Albums|รูปภาพและอัลบั้ม/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add album|เพิ่มอัลบั้ม/i }));
    const dialog = screen.getByRole("dialog", { name: /Add album|เพิ่มอัลบั้ม/i });
    fireEvent.change(within(dialog).getByLabelText(/Title|ชื่อ/i), {
      target: { value: "Trip group album" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Provider|ผู้ให้บริการ/i), {
      target: { value: "google_photos" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Album link|ลิงก์อัลบั้ม/i), {
      target: { value: "https://photos.app.goo.gl/trip-group" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save album|บันทึกอัลบั้ม/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Select Trip group album|เลือก Trip group album/i,
      }),
    ).toBeInTheDocument();
  });
});
