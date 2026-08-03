"use client";

import { IconPlus, IconX } from "@/components/shared/icons";
import { SelectField } from "@/components/shared/form/SelectField";
import { TextField } from "@/components/shared/form/TextField";
import {
  SOCIAL_LINKS_LIMITS,
  SOCIAL_PLATFORMS,
  type SocialLinkDraft,
  type SocialPlatform,
} from "@/lib/utils/validation";
import { toArabicDigits } from "@/lib/utils/format";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  tiktok: "تيك توك",
  other: "رابط آخر",
};

export function SocialLinksEditor({
  links,
  onChange,
  error,
  inputClassName,
}: {
  links: SocialLinkDraft[];
  onChange: (links: SocialLinkDraft[]) => void;
  error?: string;
  inputClassName?: string;
}) {
  function updateLink(index: number, patch: Partial<SocialLinkDraft>) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function addLink() {
    const used = new Set(links.map((link) => link.platform));
    const nextPlatform = SOCIAL_PLATFORMS.find(
      (platform) => !used.has(platform),
    );
    onChange([
      ...links,
      { platform: nextPlatform ?? "other", url: "" },
    ]);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-bold text-foreground">
            روابط السوشيال{" "}
            <span className="font-normal text-muted">(اختياري)</span>
          </p>
          <p className="text-sm text-muted">
            فيسبوك، إنستغرام، تيك توك، أو رابط آخر — لغاية{" "}
            {toArabicDigits(SOCIAL_LINKS_LIMITS.max)} روابط
          </p>
        </div>
        <button
          type="button"
          onClick={addLink}
          disabled={links.length >= SOCIAL_LINKS_LIMITS.max}
          className="flex min-h-12 items-center gap-2 rounded-xl border border-accent px-4 text-base font-bold text-accent transition-colors hover:bg-accent hover:text-on-accent disabled:opacity-40"
        >
          <IconPlus className="h-5 w-5" />
          أضف رابط
        </button>
      </div>

      {links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center text-base text-muted">
          مفيش روابط مضافة — اضغط «أضف رابط» لو الصنايعي عنده صفحات تواصل.
        </p>
      ) : (
        <div className="grid gap-3">
          {links.map((link, index) => {
            const usedElsewhere = new Set(
              links
                .map((item) => item.platform)
                .filter((_, i) => i !== index),
            );
            return (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[11rem_1fr_auto] sm:items-center"
              >
                <SelectField
                  value={link.platform}
                  aria-label={`منصة الرابط ${index + 1}`}
                  onChange={(event) =>
                    updateLink(index, {
                      platform: event.target.value as SocialPlatform,
                    })
                  }
                  className={inputClassName}
                >
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option
                      key={platform}
                      value={platform}
                      disabled={usedElsewhere.has(platform)}
                    >
                      {PLATFORM_LABELS[platform]}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  dir="ltr"
                  type="url"
                  inputMode="url"
                  maxLength={SOCIAL_LINKS_LIMITS.urlMax}
                  value={link.url}
                  placeholder="https://..."
                  aria-label={`رابط المنصة ${index + 1}`}
                  className={
                    inputClassName
                      ? `${inputClassName} text-left`
                      : "text-left"
                  }
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                />
                <button
                  type="button"
                  aria-label={`حذف الرابط ${index + 1}`}
                  onClick={() => removeLink(index)}
                  className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger sm:self-start"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-base font-bold text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
