// Resize all existing images in the `chat-images` and `pets` Supabase storage
// buckets in-place. Idempotent: images already small enough are skipped.
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Usage:
//   node scripts/resize-existing-images.mjs               # both buckets
//   node scripts/resize-existing-images.mjs chat-images   # one bucket
//   DRY_RUN=1 node scripts/resize-existing-images.mjs     # report only
import { readFileSync } from "node:fs";
import sharp from "sharp";

function loadEnv() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const DRY_RUN = process.env.DRY_RUN === "1";

const BUCKETS = process.argv.slice(2).filter(Boolean);
const TARGETS = BUCKETS.length ? BUCKETS : ["chat-images", "pets"];

// Per-bucket resize settings. Long-edge cap + JPEG quality.
const SETTINGS = {
  "chat-images": { maxDim: 1280, quality: 82 },
  pets: { maxDim: 1024, quality: 85 },
};

const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function listAll(bucket) {
  const out = [];
  const queue = [""];
  while (queue.length) {
    const prefix = queue.shift();
    let offset = 0;
    // Storage list endpoint pages by limit/offset.
    while (true) {
      const r = await fetch(`${URL_BASE}/storage/v1/object/list/${bucket}`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
      });
      if (!r.ok) {
        console.error(`list ${bucket}/${prefix} failed: ${r.status} ${await r.text()}`);
        return out;
      }
      const items = await r.json();
      if (!items.length) break;
      for (const it of items) {
        const path = prefix ? `${prefix}/${it.name}` : it.name;
        if (it.id == null && it.metadata == null) {
          // Looks like a folder entry.
          queue.push(path);
        } else {
          out.push({ path, size: it.metadata?.size ?? 0, mime: it.metadata?.mimetype ?? "" });
        }
      }
      if (items.length < 100) break;
      offset += items.length;
    }
  }
  return out;
}

async function download(bucket, path) {
  const r = await fetch(
    `${URL_BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`,
    { headers: HEADERS },
  );
  if (!r.ok) throw new Error(`download ${bucket}/${path}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function upload(bucket, path, buf, contentType) {
  const r = await fetch(
    `${URL_BASE}/storage/v1/object/${bucket}/${encodeURI(path)}`,
    {
      method: "PUT",
      headers: {
        ...HEADERS,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "max-age=3600",
      },
      body: buf,
    },
  );
  if (!r.ok) throw new Error(`upload ${bucket}/${path}: ${r.status} ${await r.text()}`);
}

function isImage(mime, path) {
  if (mime && mime.startsWith("image/") && mime !== "image/gif") return true;
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(path);
}

async function processBucket(bucket) {
  const { maxDim, quality } = SETTINGS[bucket] ?? { maxDim: 1280, quality: 82 };
  console.log(`\n→ ${bucket} (max ${maxDim}px, q=${quality})${DRY_RUN ? "  [DRY RUN]" : ""}`);
  const items = await listAll(bucket);
  console.log(`  ${items.length} object(s) found`);
  let savedBytes = 0;
  let touched = 0;
  let skipped = 0;
  let errored = 0;

  for (const it of items) {
    if (!isImage(it.mime, it.path)) {
      skipped++;
      continue;
    }
    try {
      const original = await download(bucket, it.path);
      const meta = await sharp(original).metadata();
      const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
      if (longest === 0) {
        skipped++;
        continue;
      }
      const needsResize = longest > maxDim;
      const isAlreadyJpeg = meta.format === "jpeg";
      if (!needsResize && isAlreadyJpeg && original.length < 200_000) {
        skipped++;
        continue;
      }
      const pipeline = sharp(original).rotate();
      if (needsResize) {
        pipeline.resize({
          width: meta.width >= meta.height ? maxDim : undefined,
          height: meta.height > meta.width ? maxDim : undefined,
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      const out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      if (out.length >= original.length) {
        skipped++;
        continue;
      }
      const delta = original.length - out.length;
      savedBytes += delta;
      touched++;
      console.log(
        `  ${it.path}  ${(original.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`,
      );
      if (!DRY_RUN) await upload(bucket, it.path, out, "image/jpeg");
    } catch (e) {
      errored++;
      console.error(`  ! ${it.path}: ${e.message}`);
    }
  }
  console.log(
    `  done: ${touched} rewritten, ${skipped} skipped, ${errored} errors, saved ~${(savedBytes / 1024 / 1024).toFixed(2)} MB`,
  );
}

for (const b of TARGETS) await processBucket(b);
