"use client";

import { IconSparkles } from "@/components/shared/icons";
import type { ProfileFormFieldName } from "@/hooks/dashboard/useCraftsmanProfileForm";

interface ProfileBioSectionProps {
  description: string;
  getFieldError: (field: ProfileFormFieldName) => string | undefined;
  onFieldChange: (field: ProfileFormFieldName, value: string) => void;
  onFieldBlur: (field: ProfileFormFieldName) => void;
}

export function ProfileBioSection({
  description,
  getFieldError,
  onFieldChange,
  onFieldBlur,
}: ProfileBioSectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <IconSparkles className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-foreground">
            نبذة عن خدماتك وخبرتك المهنية
          </h2>
        </div>
        <span className="text-xs font-bold text-muted">
          {description.length}/1000 حرف
        </span>
      </div>

      <div>
        <textarea
          id="description-textarea"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          onBlur={() => onFieldBlur("description")}
          placeholder="اكتب هنا التخصصات اللي بتشتغل فيها بدقة، سنوات خبرتك، وأي خدمات إضافية بتقدمها لأهل السويس (مثال: صيانة منزلية سريعة، تشطيبات، كشف أعطال)..."
          className={`w-full rounded-xl border bg-background p-4 text-base text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y leading-relaxed ${
            getFieldError("description") ? "border-danger focus:border-danger" : "border-border"
          }`}
        />
        {getFieldError("description") ? (
          <p className="mt-1.5 text-sm font-semibold text-danger">{getFieldError("description")}</p>
        ) : (
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            💡 نصيحة: الوصف المفصل والواضح يرفع ثقة العميل بك بنسبة كبيرة ويسهل عليه معرفة ما إذا كانت مشكلته من اختصاصك قبل الاتصال.
          </p>
        )}
      </div>
    </div>
  );
}
