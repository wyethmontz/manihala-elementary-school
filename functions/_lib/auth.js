// Shared auth helpers for Pages Functions. Stateless signed session cookie (HMAC-SHA256) +
// PBKDF2 password verification. No plaintext secrets ever touch the repo — both
// ADMIN_PASSWORD_HASH and SESSION_SECRET are Cloudflare secrets bound at runtime via env.

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function b64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

async function createSessionToken(env) {
  const payload = JSON.stringify({ role: "admin", exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const payloadB64 = b64urlEncode(payload);
  const key = await hmacKey(env.SESSION_SECRET);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return payloadB64 + "." + b64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach(part => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  });
  return out;
}

async function isAdminRequest(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  try {
    const key = await hmacKey(env.SESSION_SECRET);
    const sigBytes = Uint8Array.from(b64urlDecode(sigB64), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payloadB64));
    if (!valid) return false;
    const payload = JSON.parse(b64urlDecode(payloadB64));
    return payload.role === "admin" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function sessionCookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}
function clearCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function constantTimeEqual(hexA, hexB) {
  if (hexA.length !== hexB.length) return false;
  let diff = 0;
  for (let i = 0; i < hexA.length; i++) diff |= hexA.charCodeAt(i) ^ hexB.charCodeAt(i);
  return diff === 0;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, iterationsStr, hashHex] = (storedHash || "").split(":");
  if (!saltHex || !iterationsStr || !hashHex) return false;
  const iterations = parseInt(iterationsStr, 10);
  // Cloudflare Workers' PBKDF2 implementation rejects iteration counts above 100000.
  if (!Number.isInteger(iterations) || iterations <= 0 || iterations > 100000) return false;
  try {
    const salt = fromHex(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256
    );
    return constantTimeEqual(toHex(derived), hashHex);
  } catch {
    return false;
  }
}

// Simple fixed-window rate limit backed by KV. Returns true if the request should be blocked.
async function isRateLimited(env, key, maxAttempts, windowSeconds) {
  const raw = await env.SCHOOL_DATA.get(key);
  const now = Date.now();
  let state = raw ? JSON.parse(raw) : { count: 0, resetAt: now + windowSeconds * 1000 };
  if (now > state.resetAt) state = { count: 0, resetAt: now + windowSeconds * 1000 };
  if (state.count >= maxAttempts) return true;
  state.count += 1;
  await env.SCHOOL_DATA.put(key, JSON.stringify(state), { expirationTtl: windowSeconds + 5 });
  return false;
}

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init && init.headers) }
  });
}

export {
  createSessionToken, isAdminRequest, sessionCookieHeader, clearCookieHeader,
  verifyPassword, isRateLimited, json
};
