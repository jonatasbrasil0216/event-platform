import { describe, expect, it } from "vitest";
import { validateEnv } from "../src/lib/env";

describe("validateEnv", () => {
  it("accepts required variables", () => {
    const env = validateEnv({
      MONGODB_URI: "mongodb+srv://demo",
      JWT_SECRET: "secret",
      JWT_EXPIRES_IN: "7d",
      OPENAI_API_KEY: "sk-demo",
      NODE_ENV: "development"
    });

    expect(env.OPENAI_API_KEY).toBe("sk-demo");
    expect(env.JWT_EXPIRES_IN).toBe("7d");
  });

  it("throws when OPENAI_API_KEY is missing", () => {
    expect(() =>
      validateEnv({
        MONGODB_URI: "mongodb+srv://demo",
        JWT_SECRET: "secret",
        JWT_EXPIRES_IN: "7d",
        OPENAI_API_KEY: "",
        NODE_ENV: "development"
      })
    ).toThrow("Invalid environment configuration");
  });
});
