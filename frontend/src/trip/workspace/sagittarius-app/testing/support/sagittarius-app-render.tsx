import {
  fireEvent,
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import type { SagittariusAppProps } from "../../types";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) =>
      originalRerender(
        <I18nProvider initialLocale="th">{nextUi}</I18nProvider>,
      ),
  };
}

export async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), {
    target: { value: "HK-SZ-2025" },
  });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
    target: { value: "seed-trip-pass" },
  });
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
  await user.click(
    await screen.findByRole("button", { name: /Demo Traveler/i }),
  );
  fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), {
    target: { value: "owner-pin" },
  });
  await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
}

export async function renderApiSagittariusApp(
  user: ReturnType<typeof userEvent.setup>,
  props: Omit<SagittariusAppProps, "dataSource" | "requireJoin">,
) {
  const result = render(
    <SagittariusApp
      requireJoin
      dataSource="api"
      {...props}
    />,
  );
  await loginApiTrip(user);
  return result;
}

export function renderApiTripAccessSagittariusApp(
  props: Omit<SagittariusAppProps, "accessMode" | "dataSource" | "requireJoin">,
) {
  return render(
    <SagittariusApp
      accessMode="trip-access"
      requireJoin
      dataSource="api"
      {...props}
    />,
  );
}
