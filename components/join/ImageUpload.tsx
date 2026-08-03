import { useRef } from "react";
import type { ChangeEvent } from "react";
import { IconCamera, IconX } from "@/components/shared/icons";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/storage/images";

type ImageUploadProps = {
  preview: string;
  error: string;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
};

export function ImageUpload({ preview, error, onSelect, onRemove }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onSelect(e.target.files?.[0]);
    e.target.value = "";
  }

  return (
    <div>
      <label className="mb-1 block text-base font-bold">
        صورة الصنايعي <span className="font-normal text-muted">(اختياري)</span>
      </label>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="معاينة صورة الصنايعي"
            className="aspect-[4/3] w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="حذف الصورة"
            className="absolute top-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-colors hover:bg-background"
          >
            <IconX className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 left-3 min-h-12 rounded-xl bg-card/90 px-4 text-base font-bold text-foreground shadow-card transition-colors hover:bg-background"
          >
            غيّر الصورة
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/40 p-6 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <IconCamera className="h-8 w-8" />
          <span className="text-base font-bold">اضغط لرفع صورة</span>
          <span className="text-base">
            JPG أو PNG — بنحوّلها لـ WebP أوتوماتيك لحد {MAX_IMAGE_SIZE_MB} ميجا
          </span>
        </button>
      )}

      {error && <p className="mt-2 text-base font-bold text-accent">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
