import {
  fireEvent,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit bookings and photos", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("opens the Bookings & Docs workspace and creates a local booking record", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="bookings" />);

    expect(
      screen.getByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Select Bangkok to Hong Kong flight|เลือก Bangkok to Hong Kong flight/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(External link|ลิงก์ภายนอก)$/i }), {
      target: { value: "https://drive.google.com/airport-express" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Select Airport Express pass|เลือก Airport Express pass/i,
      }),
    ).toBeInTheDocument();
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
