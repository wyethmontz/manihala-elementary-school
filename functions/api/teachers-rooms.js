import { isAdminRequest, json } from "../_lib/auth.js";

const KV_KEY = "teachers-rooms";
const MAX_ROWS = 100;
const MAX_NAME_LEN = 80;
const MAX_COUNT = 100000;

function isValidCount(n) {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= MAX_COUNT;
}

function validatePayload(body) {
  if (!Array.isArray(body) || body.length > MAX_ROWS) return "Invalid payload.";
  for (const row of body) {
    if (!Array.isArray(row) || row.length !== 3) return "Invalid row.";
    const [name, teachers, rooms] = row;
    if (typeof name !== "string" || !name.trim() || name.length > MAX_NAME_LEN) return "Invalid grade level name.";
    if (!isValidCount(teachers) || !isValidCount(rooms)) return "Invalid teacher/room count.";
  }
  return null;
}

async function loadData(env) {
  const raw = await env.SCHOOL_DATA.get(KV_KEY);
  if (!raw) return { rows: [], updatedAt: null };
  return JSON.parse(raw);
}

export async function onRequestGet({ env }) {
  const data = await loadData(env);
  return json(data);
}

export async function onRequestPut({ request, env }) {
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) return json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, { status: 400 });
  }

  const err = validatePayload(body);
  if (err) return json({ error: err }, { status: 400 });

  const toStore = { rows: body, updatedAt: new Date().toISOString() };
  await env.SCHOOL_DATA.put(KV_KEY, JSON.stringify(toStore));
  return json({ ok: true, updatedAt: toStore.updatedAt });
}
