import type { Locale } from "./types";
import { enMessages } from "./messages/en";
import { thMessages } from "./messages/th";

export const messages = {
  en: enMessages,
  th: thMessages,
} as const;

type WidenMessages<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : T extends string
    ? string
    : { readonly [Key in keyof T]: WidenMessages<T[Key]> };

export type Messages = WidenMessages<typeof messages.en>;

const checkedMessages: Record<Locale, Messages> = messages;

export function getMessages(locale: Locale): Messages {
  return checkedMessages[locale];
}
