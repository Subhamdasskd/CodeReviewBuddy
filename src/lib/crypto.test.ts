import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken, isEncryptedToken } from "./crypto";

process.env.NEXTAUTH_SECRET = "test-secret-value-for-encryption";

describe("token encryption", () => {
  it("round-trips a token", () => {
    const token = "gho_1234567890abcdef";
    const encrypted = encryptToken(token);

    expect(encrypted).not.toContain(token);
    expect(isEncryptedToken(encrypted)).toBe(true);
    expect(decryptToken(encrypted)).toBe(token);
  });

  it("produces a different ciphertext each time", () => {
    const a = encryptToken("same-value");
    const b = encryptToken("same-value");

    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe(decryptToken(b));
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptToken("secret-token");
    const parts = encrypted.split(".");
    const data = parts[2];
    const tampered = `${parts[0]}.${parts[1]}.${data.slice(0, -2)}${data.endsWith("A") ? "BB" : "AA"}`;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it("passes legacy plaintext through unchanged", () => {
    expect(decryptToken("gho_plaintext_legacy")).toBe("gho_plaintext_legacy");
    expect(isEncryptedToken("gho_plaintext_legacy")).toBe(false);
  });

  it("rejects a malformed encrypted value", () => {
    expect(() => decryptToken("enc:v1:only-one-part")).toThrow("Malformed");
  });
});
