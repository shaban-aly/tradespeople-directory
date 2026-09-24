"use client";

import { IconGlobe } from "@/components/shared/icons";
import { SocialLinksEditor } from "@/components/shared/ui/SocialLinksEditor";
import type { DashboardSocialLink } from "@/lib/db/craftsman-dashboard";

interface ProfileSocialSectionProps {
  socialLinks: DashboardSocialLink[];
  error?: string;
  onChange: (links: DashboardSocialLink[]) => void;
}

export function ProfileSocialSection({
  socialLinks,
  error,
  onChange,
}: ProfileSocialSectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <IconGlobe className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-foreground">
            روابط التواصل الاجتماعي ومعارض الأعمال
          </h2>
        </div>
        <span className="text-xs text-muted">فيسبوك، انستغرام، تيك توك</span>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        أضف روابط صفحاتك أو معارض أعمالك لتمكين العملاء من تصفح صور أعمالك السابقة ومتابعتك.
      </p>

      <SocialLinksEditor
        links={socialLinks}
        onChange={onChange}
        error={error}
      />
    </div>
  );
}
