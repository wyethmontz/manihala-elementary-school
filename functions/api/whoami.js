import { isAdminRequest, json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const isAdmin = await isAdminRequest(request, env);
  return json({ isAdmin });
}
