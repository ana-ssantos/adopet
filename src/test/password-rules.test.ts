import { describe, expect, it } from "vitest";
import { homeFor, validatePassword } from "@/store/app-store";

describe("regras de senha", () => {
  it("rejeita senha com menos de 8 caracteres", () => {
    expect(validatePassword("1234567", "1234567").password).toBeDefined();
  });
  it("aceita senha com 8 caracteres e confirmação igual", () => {
    expect(validatePassword("12345678", "12345678")).toEqual({});
  });
  it("exige confirmação igual à senha", () => {
    expect(validatePassword("12345678", "12345679").confirm).toBeDefined();
  });
});

describe("redirecionamento por tipo de conta", () => {
  it("tutor vai para a área do tutor e abrigo para o painel", () => {
    expect(homeFor("tutor")).toBe("/");
    expect(homeFor("abrigo")).toBe("/painel-abrigo");
  });
});
