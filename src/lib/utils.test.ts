import { describe, expect, it } from "vitest";
import { initials, isOverdue } from "./utils";

describe("display utilities", () => {
  it("creates two-letter initials", () => {
    expect(initials("Shahid Ali")).toBe("SA");
    expect(initials("Maya")).toBe("M");
  });

  it("detects past dates", () => {
    expect(isOverdue("2020-01-01T12:00:00.000Z")).toBe(true);
    expect(isOverdue(null)).toBe(false);
  });
});
