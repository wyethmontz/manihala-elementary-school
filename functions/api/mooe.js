import { isAdminRequest, json } from "../_lib/auth.js";

const PERIODS = ["Jan-Feb", "Mar-Apr", "May-Jun", "Jul-Aug", "Sep-Oct", "Nov-Dec"];
const KV_KEY = "mooe";
const MAX_CATEGORIES = 100;
const MAX_NAME_LEN = 120;
const MAX_AMOUNT = 100000000; // ₱100M sanity ceiling, well above any real MOOE figure

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function validateAmount(n) {
  return isFiniteNumber(n) && n >= 0 && n <= MAX_AMOUNT;
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid payload.";
  if (!validateAmount(body.budget)) return "Invalid budget.";
  if (!Array.isArray(body.downloaded) || body.downloaded.length !== 6) return "Invalid downloaded array.";
  if (!body.downloaded.every(validateAmount)) return "Invalid downloaded amount.";
  if (!Array.isArray(body.categories) || body.categories.length > MAX_CATEGORIES) return "Invalid categories.";
  for (const entry of body.categories) {
    if (!Array.isArray(entry) || entry.length !== 2) return "Invalid category entry.";
    const [name, exp] = entry;
    if (typeof name !== "string" || !name.trim() || name.length > MAX_NAME_LEN) return "Invalid category name.";
    if (!Array.isArray(exp) || exp.length !== 6 || !exp.every(validateAmount)) return "Invalid category expenses.";
  }
  return null;
}

async function loadData(env) {
  const raw = await env.SCHOOL_DATA.get(KV_KEY);
  if (!raw) {
    return { budget: 0, periods: PERIODS, downloaded: [0,0,0,0,0,0], categories: [], updatedAt: null };
  }
  const parsed = JSON.parse(raw);
  parsed.periods = PERIODS;
  return parsed;
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

  const toStore = {
    budget: body.budget,
    periods: PERIODS,
    downloaded: body.downloaded,
    categories: body.categories,
    updatedAt: new Date().toISOString()
  };
  await env.SCHOOL_DATA.put(KV_KEY, JSON.stringify(toStore));
  return json({ ok: true, updatedAt: toStore.updatedAt });
}
