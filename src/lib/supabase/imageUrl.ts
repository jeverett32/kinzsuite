/**
 * Rewrite a stored Supabase public-object URL to its image-transform variant.
 * Falls back to the original URL if the input doesn't match the expected
 * Supabase storage pattern.
 */
export function transformUrl(
  publicUrl: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number; resize?: "cover" | "contain" | "fill" },
): string {
  if (!publicUrl) return "";
  const swapped = publicUrl.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );
  if (swapped === publicUrl) return publicUrl;
  const qs = new URLSearchParams();
  if (opts.width) qs.set("width", String(opts.width));
  if (opts.height) qs.set("height", String(opts.height));
  if (opts.quality) qs.set("quality", String(opts.quality));
  if (opts.resize) qs.set("resize", opts.resize);
  const q = qs.toString();
  return q ? `${swapped}?${q}` : swapped;
}
