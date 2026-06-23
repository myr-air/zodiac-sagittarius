import type { Messages } from "@/src/i18n/messages";

type EmailLoginMessages = Messages["access"]["emailLogin"];

export function emailLoginOtpLabels(emailLoginMessages: EmailLoginMessages) {
  return {
    changeEmail: emailLoginMessages.changeEmail,
    resendCode: emailLoginMessages.resendCode,
    resendCooldown: (seconds: number) => emailLoginMessages.resendCooldown({ seconds }),
    sentCodeTo: emailLoginMessages.sentCodeTo,
    signInAccount: emailLoginMessages.signInAccount,
    verificationCode: emailLoginMessages.verificationCode,
    verificationCodeHint: emailLoginMessages.verificationCodeHint,
    verifyEmail: emailLoginMessages.verifyEmail,
  };
}

export function emailLoginCredentialsLabels(emailLoginMessages: EmailLoginMessages) {
  return {
    alternateSignInOptions: emailLoginMessages.alternateSignInOptions,
    createWithPassword: emailLoginMessages.createWithPassword,
    email: emailLoginMessages.email,
    password: emailLoginMessages.password,
    passwordHint: emailLoginMessages.passwordHint,
    signInAccount: emailLoginMessages.signInAccount,
    usePasskeyInstead: emailLoginMessages.usePasskeyInstead,
    useSignInCodeInstead: emailLoginMessages.useSignInCodeInstead,
  };
}

export function emailLoginMethodsLabels(emailLoginMessages: EmailLoginMessages) {
  return {
    changeEmail: emailLoginMessages.changeEmail,
    createFor: emailLoginMessages.createFor,
    createWithPassword: emailLoginMessages.createWithPassword,
    sendRegisterCode: emailLoginMessages.sendRegisterCode,
    sendSignInCode: emailLoginMessages.sendSignInCode,
    signInAs: emailLoginMessages.signInAs,
    signInWithPasskey: emailLoginMessages.signInWithPasskey,
    signInWithPassword: emailLoginMessages.signInWithPassword,
  };
}

export function emailLoginSetupLabels(emailLoginMessages: EmailLoginMessages) {
  return {
    createFor: emailLoginMessages.createFor,
    displayName: emailLoginMessages.displayName,
    finishSetup: emailLoginMessages.finishSetup,
    homeBase: emailLoginMessages.homeBase,
  };
}

export function emailLoginPasswordLabels(emailLoginMessages: EmailLoginMessages) {
  return {
    changeEmail: emailLoginMessages.changeEmail,
    chooseAnotherMethod: emailLoginMessages.chooseAnotherMethod,
    continueToOtp: emailLoginMessages.continueToOtp,
    createFor: emailLoginMessages.createFor,
    password: emailLoginMessages.password,
    passwordHint: emailLoginMessages.passwordHint,
    signInAs: emailLoginMessages.signInAs,
    signInWithPassword: emailLoginMessages.signInWithPassword,
  };
}
