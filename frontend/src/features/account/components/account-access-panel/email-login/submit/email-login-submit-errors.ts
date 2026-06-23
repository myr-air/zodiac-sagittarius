import type { Messages } from "@/src/i18n/messages";
import type { AuthFlow } from "../../auth";
import {
  errorMessage,
  passwordLoginErrorMessage,
} from "../../auth";

export interface EmailLoginSubmitErrorContext {
  emailLoginMessages: Messages["access"]["emailLogin"];
  messages: Messages["access"]["messages"];
}

export function buildEmailLoginSubmitErrorContext({
  emailLoginMessages,
  messages,
}: EmailLoginSubmitErrorContext): EmailLoginSubmitErrorContext {
  return {
    emailLoginMessages,
    messages,
  };
}

export function emailLoginStartError(
  caught: unknown,
  context: EmailLoginSubmitErrorContext,
): string {
  return errorMessage(
    caught,
    context.emailLoginMessages.errors.startFailed,
    context.messages,
  );
}

export function emailLoginInvalidCodeError(
  caught: unknown,
  context: EmailLoginSubmitErrorContext,
): string {
  return errorMessage(
    caught,
    context.emailLoginMessages.errors.invalidCode,
    context.messages,
  );
}

export function emailLoginPasswordSetupError(
  caught: unknown,
  context: EmailLoginSubmitErrorContext,
): string {
  return errorMessage(
    caught,
    context.emailLoginMessages.errors.passwordRegisterFailed,
    context.messages,
  );
}

export function emailLoginPasswordSubmitError({
  activeFlow,
  caught,
  context,
}: {
  activeFlow: AuthFlow;
  caught: unknown;
  context: EmailLoginSubmitErrorContext;
}): string {
  if (activeFlow === "register") {
    return emailLoginPasswordSetupError(caught, context);
  }
  return passwordLoginErrorMessage(
    caught,
    context.emailLoginMessages.errors.passwordLoginFailed,
    context.messages,
  );
}

export function emailLoginPasskeyError(
  caught: unknown,
  context: EmailLoginSubmitErrorContext,
): string {
  return errorMessage(
    caught,
    context.emailLoginMessages.errors.passkeyLoginFailed,
    context.messages,
  );
}
