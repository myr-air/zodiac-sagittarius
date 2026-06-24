import { describe, expect, it } from "vitest";
import {
  emailLoginSubmitRouteValues,
  selectEmailLoginSubmitHandler,
  selectEmailLoginSubmitRoute,
} from "../email-login-submit-route";

const handlers = {
  setup: "setup-handler",
  code: "code-handler",
  password: "password-handler",
  email: "email-handler",
};

describe("selectEmailLoginSubmitRoute", () => {
  it("keeps submit routes in handler lookup order", () => {
    expect(emailLoginSubmitRouteValues).toEqual([
      "setup",
      "code",
      "password",
      "email",
    ]);
  });

  it("keeps setup submission isolated from challenge state", () => {
    expect(selectEmailLoginSubmitRoute({ authStep: "setup", hasChallenge: false })).toBe("setup");
    expect(selectEmailLoginSubmitRoute({ authStep: "setup", hasChallenge: true })).toBe("setup");
  });

  it("routes an active email challenge to code verification", () => {
    expect(selectEmailLoginSubmitRoute({ authStep: "email", hasChallenge: true })).toBe("code");
    expect(selectEmailLoginSubmitRoute({ authStep: "password", hasChallenge: true })).toBe("code");
  });

  it("routes password and email entry states without a challenge", () => {
    expect(selectEmailLoginSubmitRoute({ authStep: "password", hasChallenge: false })).toBe("password");
    expect(selectEmailLoginSubmitRoute({ authStep: "email", hasChallenge: false })).toBe("email");
    expect(selectEmailLoginSubmitRoute({ authStep: "methods", hasChallenge: false })).toBe("email");
  });

  it("selects the matching submit handler from the route", () => {
    expect(selectEmailLoginSubmitHandler({ authStep: "setup", handlers, hasChallenge: true })).toBe("setup-handler");
    expect(selectEmailLoginSubmitHandler({ authStep: "email", handlers, hasChallenge: true })).toBe("code-handler");
    expect(selectEmailLoginSubmitHandler({ authStep: "password", handlers, hasChallenge: false })).toBe(
      "password-handler",
    );
  });
});
