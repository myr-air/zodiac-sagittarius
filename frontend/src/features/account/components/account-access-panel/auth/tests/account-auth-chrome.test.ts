import { describe, expect, it } from "vitest";
import { authFlowValues } from "../account-auth-chrome";

describe("account auth chrome values", () => {
  it("keeps account auth flows in route tab order", () => {
    expect(authFlowValues).toEqual(["login", "register"]);
  });
});
