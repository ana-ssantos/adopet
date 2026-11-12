import { describe, expect, it } from "vitest";
import { homeFor, validatePassword } from "@/store/app-store";

describe("regras de senha", () => {
  it("rejeita senha com menos de 8 caracteres", () => {
    expect(validatePassword("1234567", "1234567").password).toBeDefined();
  });
  it("aceita senha com 8 caracteres e confirmação igual", () => {
    expect(validatePassword("abc12345", "abc12345")).toEqual({});
  });
  it("aceita exatamente 8 caracteres com letras e números", () => {
    expect(validatePassword("abcd1234", "abcd1234")).toEqual({});
  });
  it("ignora espaços acidentais", () => {
    expect(validatePassword(" abcd1234 ", "abcd1234")).toEqual({});
  });
  it("aponta falta de letra e falta de número", () => {
    expect(validatePassword("12345678", "12345678").password).toMatch(/letra/);
    expect(validatePassword("abcdefgh", "abcdefgh").password).toMatch(/número/);
  });
  it("não compara antes de preencher a confirmação", () => {
    expect(validatePassword("abcd1234", "").confirm).toBe("Confirme sua senha");
  });
  it("exige confirmação igual à senha", () => {
    expect(validatePassword("abc12345", "abc12346").confirm).toBeDefined();
  });
});

describe("redirecionamento por tipo de conta", () => {
  it("tutor vai para a área do tutor e abrigo para o painel", () => {
    expect(homeFor("tutor")).toBe("/");
    expect(homeFor("abrigo")).toBe("/painel-abrigo");
  });
});
