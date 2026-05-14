// Quick health check for the Supabase project. Pure HTTP, no SDK
// (avoids Node 20's missing WebSocket).
// Usage: node scripts/test-connection.mjs
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const G = "\u001b[32m";
const R = "\u001b[31m";
const Y = "\u001b[33m";
const D = "\u001b[2m";
const X = "\u001b[0m";

const checks = [];
function log(label, ok, detail = "") {
  const tick = ok ? `${G}✓${X}` : `${R}✗${X}`;
  console.log(`${tick} ${label}${detail ? `  ${D}${detail}${X}` : ""}`);
  checks.push(ok);
}

console.log("\nKinzSuite ▸ Supabase connection test\n");

if (!url || !key) {
  log("env vars present", false,
    "missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}
log("env vars present", true, `url=${url}`);
log("key format looks new (sb_publishable_…)", key.startsWith("sb_publishable_"),
  key.startsWith("sb_publishable_")
    ? key.slice(0, 22) + "…"
    : "got legacy JWT (still works, but consider rotating)");

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// 1. Auth health
try {
  const r = await fetch(`${url}/auth/v1/health`, { headers });
  let info = "";
  try { info = (await r.json()).name || ""; } catch {}
  log("auth endpoint reachable", r.ok, `${r.status} ${info}`);
} catch (e) {
  log("auth endpoint reachable", false, e.message);
}

// 2. PostgREST: HEAD count on each table.
//    A 200/206 with content-range = rows visible (anon may see 0 with RLS).
//    A 404 / PGRST205 (or "relation does not exist" / 42P01) = migrations not run.
//    A 401/403 = key invalid.
async function checkTable(name) {
  const r = await fetch(`${url}/rest/v1/${name}?select=*`, {
    method: "HEAD",
    headers: { ...headers, Prefer: "count=exact" },
  });
  if (r.status === 200 || r.status === 206) {
    const range = r.headers.get("content-range") || "";
    const total = range.split("/").pop() || "0";
    // 0 rows is expected — RLS policies are `to authenticated`, so anon is
    // filtered out. We mostly want to know the table is reachable.
    log(`table "${name}" exists`, true,
      total === "0" ? "RLS filtering anon (expected)" : `${total} rows visible to anon`);
    return;
  }
  if (r.status === 401 || r.status === 403) {
    // 401 with body PGRST301 means RLS denied — table exists. We can't read
    // the body of a HEAD but Supabase echoes the code in a header on PostgREST.
    const code = r.headers.get("x-pg-error-code") || r.headers.get("x-postgrest-error-code");
    if (code && code !== "42P01") {
      log(`table "${name}" exists`, true, `RLS active (${r.status} ${code})`);
      return;
    }
    // We can't tell — try a GET to read the body.
    const r2 = await fetch(`${url}/rest/v1/${name}?select=id&limit=1`, { headers });
    const body = await r2.text();
    if (r2.ok) {
      log(`table "${name}" exists`, true, `anon-readable`);
    } else if (body.includes("does not exist") || body.includes("42P01")) {
      log(`table "${name}" exists`, false, "relation does not exist — run 0001_init.sql");
    } else {
      log(`table "${name}" exists`, true, `RLS active (${r2.status})`);
    }
    return;
  }
  if (r.status === 404) {
    // PostgREST 12+ returns 404 with PGRST205 when the table doesn't exist.
    const r2 = await fetch(`${url}/rest/v1/${name}?select=id&limit=1`, { headers });
    const body = await r2.text();
    log(`table "${name}" exists`, false,
      body.includes("not find") || body.includes("PGRST205") || body.includes("42P01")
        ? "missing — run 0001_init.sql"
        : `unexpected 404 ${body.slice(0, 80)}`);
    return;
  }
  log(`table "${name}" exists`, false, `unexpected HTTP ${r.status}`);
}

for (const t of ["profiles", "pets", "daily_tasks", "messages"]) {
  await checkTable(t);
}

// 3. Storage buckets — listing requires service_role, but for public buckets
//    we can just hit the public list-objects endpoint.
async function checkBucket(name) {
  const r = await fetch(`${url}/storage/v1/object/list/${name}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1 }),
  });
  const body = await r.text();
  if (r.ok) {
    log(`bucket "${name}" exists`, true, "public read OK");
    return;
  }
  if (r.status === 404 || body.includes("not found") || body.includes("Bucket not found")) {
    log(`bucket "${name}" exists`, false, "missing — run 0002_storage.sql");
    return;
  }
  if (r.status === 400 || r.status === 401 || r.status === 403) {
    // 400 with "new row violates..." style or 401 means the bucket exists but
    // anon listing is restricted — that's actually fine, the bucket is there.
    log(`bucket "${name}" exists`, true, `present (anon list restricted: ${r.status})`);
    return;
  }
  log(`bucket "${name}" exists`, false, `unexpected ${r.status} ${body.slice(0, 80)}`);
}
for (const b of ["pets", "chat-images"]) {
  await checkBucket(b);
}

const allOk = checks.every(Boolean);
console.log();
if (allOk) {
  console.log(`${G}All checks passed.${X}`);
  process.exit(0);
} else {
  console.log(`${Y}Some checks failed — see the messages above.${X}`);
  process.exit(1);
}
