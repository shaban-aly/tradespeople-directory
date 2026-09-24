"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ImagePositionEditor } from "@/components/dashboard/ImagePositionEditor";
import {
  IconCamera,
  IconCrop,
  IconMaximize,
} from "@/components/shared/icons";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage/images";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";

interface ProfileAvatarSectionProps {
  profile: CraftsmanSelfProfile;
  name: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentAvatarUrl: string | null;
  currentAvatarPos: AvatarPosition | null;
  selectedNewFile: File | null;
  avatarError: string | null;
  isPositionEditorOpen: boolean;
  onFilePicked: (file: File) => void;
  onOpenViewer: () => void;
  onTogglePositionEditor: () => void;
  onPositionSaved: (result: { imageUrl: string | null; position: AvatarPosition }) => void;
  onPositionClosed: () => void;
}

export function ProfileAvatarSection({
  profile,
  name,
  fileInputRef,
  currentAvatarUrl,
  currentAvatarPos,
  selectedNewFile,
  avatarError,
  isPositionEditorOpen,
  onFilePicked,
  onOpenViewer,
  onTogglePositionEditor,
  onPositionSaved,
  onPositionClosed,
}: ProfileAvatarSectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <IconCamera className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-foreground">
            الصورة الشخصية وصورة العمل
          </h2>
        </div>
        <span className="text-xs text-muted">صورة واضحة تزيد الثقة</span>
      </div>

      {avatarError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600"
        >
          {avatarError}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* أفاتار / معاينة الصورة */}
        <div
          onClick={() => {
            if (currentAvatarUrl) onOpenViewer();
          }}
          className={`group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border shadow-sm sm:h-28 sm:w-28 ${
            currentAvatarUrl
              ? "cursor-pointer transition-transform hover:scale-102 focus-visible:ring-2 focus-visible:ring-accent"
              : ""
          }`}
          title={currentAvatarUrl ? "اضغط لمعاينة الصورة بحجم كامل" : undefined}
          role={currentAvatarUrl ? "button" : undefined}
          tabIndex={currentAvatarUrl ? 0 : undefined}
          onKeyDown={(e) => {
            if (currentAvatarUrl && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onOpenViewer();
            }
          }}
        >
          {currentAvatarUrl ? (
            <>
              <Image
                src={currentAvatarUrl}
                alt={profile.name}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-cover"
                style={{
                  objectPosition: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                  transform:
                    (currentAvatarPos?.zoom ?? 1) > 1
                      ? `scale(${currentAvatarPos?.zoom})`
                      : undefined,
                  transformOrigin: `${currentAvatarPos?.x ?? 50}% ${currentAvatarPos?.y ?? 50}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <IconMaximize className="h-6 w-6 text-white" />
              </div>
            </>
          ) : (
            <CraftsmanAvatar
              name={name || profile.name}
              className="h-full w-full rounded-2xl text-2xl"
            />
          )}
        </div>

        {/* أدوات التحكم بالصورة */}
        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-right">
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            صورة واضحة لك في ورشتك أو لموقع العمل تزيد من اتصالات العملاء بنسبة 40% وتمنح بروفايلك مصداقية أعلى.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFilePicked(file);
              e.target.value = "";
            }}
          />

          <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-card hover:border-accent/50 active:scale-98"
            >
              <IconCamera className="h-4 w-4 text-accent" />
              <span>{currentAvatarUrl ? "تغيير الصورة" : "رفع صورة"}</span>
            </button>

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={onTogglePositionEditor}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all active:scale-98 ${
                  isPositionEditorOpen && !selectedNewFile
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground hover:bg-card"
                }`}
                title="تنسيق وتوسيط إطار الصورة"
              >
                <IconCrop className="h-4 w-4" />
                <span>تنسيق وموضع الصورة</span>
              </button>
            )}

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={onOpenViewer}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-card hover:text-foreground active:scale-98"
                title="معاينة وتكبير الصورة بحجم كامل"
              >
                <IconMaximize className="h-4 w-4" />
                <span>معاينة مكبرة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* محرر تنسيق وموضع الصورة */}
      {isPositionEditorOpen && (selectedNewFile || currentAvatarUrl) && (
        <div className="mt-4 border-t border-border pt-4 animate-in fade-in duration-200">
          <ImagePositionEditor
            craftsmanId={profile.id}
            slug={profile.slug}
            imageFile={selectedNewFile}
            imageUrl={currentAvatarUrl}
            initialPosition={currentAvatarPos}
            onSaved={onPositionSaved}
            onClose={onPositionClosed}
          />
        </div>
      )}
    </div>
  );
}
