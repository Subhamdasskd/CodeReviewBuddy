import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PREFIX = "enc:v1:";
const SALT = "codereview-buddy/token-encryption";

let cachedKey: Buffer | null = null;

function encryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required to encrypt account tokens");
  }

  cachedKey = scryptSync(secret, SALT, 32);
  return cachedKey;
}

export function isEncryptedToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Encrypts a token with AES-256-GCM. Output: enc:v1:<iv>.<tag>.<ciphertext> */
export function encryptToken(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${[iv, tag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".")}`;
}

/**
 * Decrypts a stored token.
 *
 * Values without the `enc:v1:` prefix are returned unchanged so accounts linked
 * before encryption was introduced keep working.
 */
export function decryptToken(value: string): string {
  if (!isEncryptedToken(value)) return value;

  const parts = value.slice(PREFIX.length).split(".");

  if (parts.length !== 3) {
    throw new Error("Malformed encrypted token");
  }

  const [ivPart, tagPart, dataPart] = parts;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
