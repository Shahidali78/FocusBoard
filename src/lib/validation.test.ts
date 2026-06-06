import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  registerSchema,
} from "./validation";

describe("validation schemas", () => {
  it("normalizes registration input", () => {
    const result = registerSchema.parse({
      name: "  Shahid Ali  ",
      email: "  SHAHID@EXAMPLE.COM  ",
      password: "Secure123!",
    });

    expect(result.name).toBe("Shahid Ali");
    expect(result.email).toBe("shahid@example.com");
  });

  it("rejects a password without a number", () => {
    expect(() =>
      registerSchema.parse({
        name: "Shahid Ali",
        email: "shahid@example.com",
        password: "OnlyLetters!",
      }),
    ).toThrow();
  });

  it("adds safe defaults to new tasks", () => {
    const result = createTaskSchema.parse({
      projectId: "project-1",
      columnId: "column-1",
      title: "  Ship the project  ",
    });

    expect(result.title).toBe("Ship the project");
    expect(result.priority).toBe("MEDIUM");
    expect(result.labelIds).toEqual([]);
  });

  it("normalizes project keys", () => {
    const result = createProjectSchema.parse({
      workspaceId: "workspace-1",
      name: "Website refresh",
      key: " web ",
      color: "#6D5DFB",
    });

    expect(result.key).toBe("WEB");
  });
});
