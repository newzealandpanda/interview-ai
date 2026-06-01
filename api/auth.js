import { createHmac } from "crypto";

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  return Buffer.from(padded, "base64");
}

export function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const expectedSig = createHmac("sha256", secret)
      .update(signingInput)
      .digest("base64url");

    if (expectedSig !== signatureB64) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));

    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.slice(7);
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return null;
  }

  const payload = verifyJWT(token, secret);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }

  return payload;
}
