import {
  fireEvent,
  screen,
  within,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export async function createBookingDocThroughDialog(
  user: ReturnType<typeof userEvent.setup>,
  {
    externalLink,
    status = "booked",
    title = "Airport Express pass",
    type = "public_transport",
  }: {
    externalLink?: string;
    status?: string;
    title?: string;
    type?: string;
  } = {},
) {
  await user.click(
    screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0],
  );
  const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
  fireEvent.change(
    within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }),
    {
      target: { value: title },
    },
  );
  fireEvent.change(
    within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }),
    {
      target: { value: type },
    },
  );
  fireEvent.change(
    within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }),
    {
      target: { value: status },
    },
  );
  if (externalLink) {
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: /^(External link|ลิงก์ภายนอก)$/i }),
      {
        target: { value: externalLink },
      },
    );
  }
  await user.click(
    within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
  );
}
