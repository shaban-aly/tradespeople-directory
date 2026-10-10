"use client";

import { IconPlus, IconX } from "@/components/shared/icons";
import { Button } from "@/components/shared/ui/Button";
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

const PLATFORM_PLACEHOLDERS: Record<SocialPlatform, string> = {
  facebook: "https://facebook.com/اسم-الصفحة",
  instagram: "https://instagram.com/اسم-الحساب",
  tiktok: "https://tiktok.com/@اسم-الحساب",
  other: "https://...",
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

  function handleUrlBlur(index: number, rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed) && trimmed.includes(".")) {
      updateLink(index, { url: `https://${trimmed}` });
    }
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
        <Button
          type="button"
          variant="outline"
          onClick={addLink}
          disabled={links.length >= SOCIAL_LINKS_LIMITS.max}
        >
          <IconPlus className="h-5 w-5" />
          أضف رابط
        </Button>
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
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <div className="shrink-0 sm:w-44">
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
                </div>

                <div className="flex flex-1 items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <TextField
                      dir="ltr"
                      type="url"
                      inputMode="url"
                      maxLength={SOCIAL_LINKS_LIMITS.urlMax}
                      value={link.url}
                      placeholder={PLATFORM_PLACEHOLDERS[link.platform]}
                      aria-label={`رابط المنصة ${index + 1}`}
                      className={
                        inputClassName
                          ? `${inputClassName} text-left`
                          : "text-left"
                      }
                      onChange={(event) => updateLink(index, { url: event.target.value })}
                      onBlur={(event) => handleUrlBlur(index, event.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    aria-label={`حذف الرابط ${index + 1}`}
                    title="حذف هذا الرابط"
                    onClick={() => removeLink(index)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger active:scale-95"
                  >
                    <IconX className="h-4.5 w-4.5" />
                  </button>
                </div>
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
