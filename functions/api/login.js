import { createSessionToken, sessionCookieHeader, verifyPassword, isRateLimited, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const blocked = await isRateLimited(env, `ratelimit:login:${ip}`, 5, 15 * 60);
  if (blocked) {
    return json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password.length > 200) {
    return json({ error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  if (!ok) {
    return json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await createSessionToken(env);
  return json({ ok: true }, { headers: { "Set-Cookie": sessionCookieHeader(token) } });
}
