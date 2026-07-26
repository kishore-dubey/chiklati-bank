import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyUnitSignature(
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || Array.isArray(signatureHeader)) {
    return false;
  }

  const expectedBuffer = createHmac("sha1", secret).update(rawBody).digest();
  const actualBuffer = Buffer.from(signatureHeader, "base64");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
