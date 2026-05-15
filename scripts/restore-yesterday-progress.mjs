// One-off: restore yesterday's daily_log + total_points after migration wipe.
// Requires SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_ID in .env.local
// Usage: node scripts/restore-yesterday-progress.mjs [--dry-run]
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

const CAM_EXCLUDE_TASK = "Spree";
const dryRun = process.argv.includes("--dry-run");

const projectRef = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!projectRef || !token) {
  console.error("Need SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

function kinzYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const body = await res.text();
  if (!res.ok) throw new Error(body);
  return body ? JSON.parse(body) : [];
}

async function main() {
  const logDate = kinzYesterday();
  const profiles = await query(
    "select id, display_name from public.profiles order by display_name",
  );
  const tasks = await query(
    "select user_id, task_name, points from public.daily_tasks order by user_id, sort_order",
  );

  const byUser = new Map();
  for (const t of tasks) {
    if (!byUser.has(t.user_id)) byUser.set(t.user_id, []);
    byUser.get(t.user_id).push(t);
  }

  const rows = [];
  for (const p of profiles) {
    const userTasks = byUser.get(p.id) ?? [];
    const isCam = p.display_name?.toLowerCase().includes("cam") ?? false;
    const completed = userTasks.filter(
      (t) => !(isCam && t.task_name === CAM_EXCLUDE_TASK),
    );
    const tasks_completed = completed.length;
    const points_earned = completed.reduce((s, t) => s + t.points, 0);
    rows.push({ profile: p, tasks_completed, points_earned, isCam });
    console.log(
      `${p.display_name}: ${tasks_completed} tasks, ${points_earned} pts on ${logDate}` +
        (isCam ? ` (excluding ${CAM_EXCLUDE_TASK})` : " (all tasks)"),
    );
  }

  if (dryRun) {
    console.log("\n--dry-run: no writes");
    return;
  }

  const values = rows
    .map(
      (r) =>
        `('${r.profile.id}', '${logDate}'::date, ${r.tasks_completed}, ${r.points_earned})`,
    )
    .join(",\n  ");

  const updates = rows
    .map((r) => `update public.profiles set total_points = ${r.points_earned} where id = '${r.profile.id}';`)
    .join("\n");

  await query(`
insert into public.daily_log (user_id, log_date, tasks_completed, points_earned)
values
  ${values}
on conflict (user_id, log_date) do update
  set tasks_completed = excluded.tasks_completed,
      points_earned = excluded.points_earned;

${updates}
`);

  const verify = await query(`
    select p.display_name, p.total_points, l.log_date, l.tasks_completed, l.points_earned
    from public.profiles p
    left join public.daily_log l on l.user_id = p.id and l.log_date = '${logDate}'::date
    order by p.display_name
  `);
  console.log("\nVerified:", verify);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
