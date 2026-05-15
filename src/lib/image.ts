/**
 * Client-side image downscale via canvas. Returns a JPEG Blob with the long
 * edge at most `maxDim` px. Falls back to the original file if downscale fails
 * or would upscale.
 */
export async function resizeImage(
  file: File,
  maxDim = 1280,
  quality = 0.82,
): Promise<Blob> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    if (longest <= maxDim) {
      bitmap.close?.();
      return file;
    }
    const scale = maxDim / longest;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement("canvas"), { width: w, height: h });
    const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
    bitmap.close?.();

    if ("convertToBlob" in canvas) {
      return await (canvas as OffscreenCanvas).convertToBlob({
        type: "image/jpeg",
        quality,
      });
    }
    return await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        quality,
      );
    });
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    return await createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return (await createImageBitmap(img)) as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}
