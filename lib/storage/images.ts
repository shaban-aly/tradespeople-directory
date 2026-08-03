import { createSupabase } from "../db/client";

export const MAX_IMAGE_SIZE_MB = 5;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const IMAGE_BUCKET = "craftsman-images";

export const WEBP_QUALITY = 0.8;

export const WEBP_MAX_DIMENSION = 1200;

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "نوع الملف مش مدعوم — ارفع صورة JPG أو PNG أو WebP بس";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `حجم الصورة كبير — الحد الأقصى ${MAX_IMAGE_SIZE_MB} ميجابايت`;
  }
  return null;
}

export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

export async function convertToWebP(
  file: File,
  maxDimension = WEBP_MAX_DIMENSION,
  quality = WEBP_QUALITY,
): Promise<File> {
  const image = await loadImage(file);
  const { width, height } = fitWithin(image.width, image.height, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unsupported");
  ctx.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, quality);
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.webp`, { type: "image/webp" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load-failed"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("webp-unsupported"));
    }, "image/webp", quality);
  });
}

function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export type UploadedImage = {
  url: string;
};

export async function uploadCraftsmanImage(
  file: File,
  folder: "requests" | "craftsmen",
): Promise<UploadedImage> {
  const supabase = createSupabase();

  const res = await fetch("/api/storage/sign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, fileName: file.name }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "مقدرناش نحضّر رفع الصورة");
  }
  const { token, path } = (await res.json()) as { token: string; path: string };

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .uploadToSignedUrl(path, token, file, {
      upsert: false,
      contentType: file.type,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export function extractImagePathFromUrl(
  url: string,
): string | null {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const path = extractImagePathFromUrl(url);
  if (!path) return;
  await createSupabase().storage.from(IMAGE_BUCKET).remove([path]);
}

export async function copyImageToCraftsman(
  sourceUrl: string,
  craftsmanId: string,
): Promise<string> {
  const sourcePath = extractImagePathFromUrl(sourceUrl);
  if (!sourcePath) return sourceUrl;
  const ext = (sourcePath.split(".").pop() ?? "webp").toLowerCase();
  const targetPath = `craftsmen/${craftsmanId}/${crypto.randomUUID()}-approved.${ext}`;
  const supabase = createSupabase();
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .copy(sourcePath, targetPath);
  if (error) return sourceUrl;
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(targetPath);
  return data.publicUrl;
}
