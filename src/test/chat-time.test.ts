import { describe, expect, it } from "vitest";
import { shortTime } from "@/lib/chat";
const now = new Date("2026-11-16T12:00:00Z").getTime();
const ago = (m: number) => new Date(now - m * 60000).toISOString();
describe("shortTime", () => {
  it("minutos", () => expect(shortTime(ago(10), now)).toBe("10 min"));
  it("horas", () => expect(shortTime(ago(125), now)).toBe("2 h"));
  it("ontem", () => expect(shortTime(ago(30 * 60), now)).toBe("ontem"));
});
