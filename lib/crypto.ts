import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/** AES-256-GCM blob as stored in MongoDB. All fields base64. */
export interface EncryptedBlob {
  iv: string;
  ct: string;
  tag: string;
}

function getKey(): Buffer {
  const raw = process.env.SOURCE_ENC_KEY;
  if (!raw) throw new Error("SOURCE_ENC_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SOURCE_ENC_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

export function encryptSecret(plaintext: string): EncryptedBlob {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(blob: EncryptedBlob): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(blob.ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
