import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyUnitSignature } from "../src/modules/webhooks/webhooks.signature.js";

const secret = "test-webhook-secret";
const rawBody = Buffer.from(JSON.stringify({ data: [{ id: "1", type: "application.approved" }] }));

function sign(body: Buffer, withSecret: string): string {
  return createHmac("sha1", withSecret).update(body).digest("base64");
}

describe("verifyUnitSignature", () => {
  it("accepts a valid signature", () => {
    const signature = sign(rawBody, secret);
    expect(verifyUnitSignature(rawBody, signature, secret)).toBe(true);
  });

  it("rejects a signature computed over a tampered body", () => {
    const signature = sign(rawBody, secret);
    const tamperedBody = Buffer.from(JSON.stringify({ data: [{ id: "2", type: "application.denied" }] }));
    expect(verifyUnitSignature(tamperedBody, signature, secret)).toBe(false);
  });

  it("rejects when the header is missing", () => {
    expect(verifyUnitSignature(rawBody, undefined, secret)).toBe(false);
  });

  it("rejects when the header is an array (duplicated header)", () => {
    const signature = sign(rawBody, secret);
    expect(verifyUnitSignature(rawBody, [signature, signature], secret)).toBe(false);
  });

  it("rejects a malformed base64 signature without throwing", () => {
    expect(() => verifyUnitSignature(rawBody, "not-valid-base64!!!", secret)).not.toThrow();
    expect(verifyUnitSignature(rawBody, "not-valid-base64!!!", secret)).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const signature = sign(rawBody, "wrong-secret");
    expect(verifyUnitSignature(rawBody, signature, secret)).toBe(false);
  });
});
