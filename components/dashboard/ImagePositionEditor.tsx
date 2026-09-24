"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area, type Point } from "react-easy-crop";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import { saveCraftsmanAvatarStandalone } from "@/lib/db/craftsman-dashboard";
import { revalidateProfileAfterSave } from "@/app/dashboard/actions";
import { IconCheck, IconRefresh } from "@/components/shared/icons";

interface ImagePositionEditorProps {
  craftsmanId: string;
  slug?: string;
  imageFile?: File | null;
  imageUrl?: string | null;
  initialPosition?: AvatarPosition | null;
  onSaved?: (result: { imageUrl: string | null; position: AvatarPosition }) => void;
  onClose?: () => void;
}

export function ImagePositionEditor({
  craftsmanId,
  slug,
  imageFile,
  imageUrl,
  initialPosition,
  onSaved,
  onClose,
}: ImagePositionEditorProps) {
  const router = useRouter();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // توليد رابط محلي فوري للملف الجديد وإلغاؤه عند الانتهاء لمنع تسريب الذاكرة
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setObjectUrl(null);
  }, [imageFile]);

  const activeSrc = objectUrl || imageUrl || "";

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialPosition?.zoom ?? 1);
  const [focalPoint, setFocalPoint] = useState<AvatarPosition>({
    x: initialPosition?.x ?? 50,
    y: initialPosition?.y ?? 50,
    zoom: initialPosition?.zoom ?? 1,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // حساب نقطة التركيز (X%, Y%) من المساحة المحددة
  const onCropComplete = useCallback((croppedArea: Area) => {
    const focalX = Math.round(croppedArea.x + croppedArea.width / 2);
    const focalY = Math.round(croppedArea.y + croppedArea.height / 2);

    setFocalPoint((prev) => ({
      x: Math.min(Math.max(focalX, 0), 100),
      y: Math.min(Math.max(focalY, 0), 100),
      zoom: prev.zoom,
    }));
  }, []);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setFocalPoint((prev) => ({
      ...prev,
      zoom: Number(newZoom.toFixed(2)),
    }));
  };

  // حفظ الصورة والإحداثيات
  const handleSave = async () => {
    if (!activeSrc) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      const payload: AvatarPosition = {
        x: focalPoint.x,
        y: focalPoint.y,
        zoom: Number(zoom.toFixed(2)),
      };

      // تنفيذ عملية الحفظ المستقلة (رفع الملف إن وُجد + تحديث DB + حذف القديمة بأمان)
      const result = await saveCraftsmanAvatarStandalone({
        craftsmanId,
        imageFile: imageFile ?? null,
        position: payload,
        existingImageUrl: imageUrl ?? null,
      });

      // إبطال كاش الصفحة والسيرفر لتحديث الصور المنشورة وهيدر الداشبورد فوراً
      await revalidateProfileAfterSave(slug);
      router.refresh();

      setSuccessMsg(true);
      if (onSaved) {
        onSaved({
          imageUrl: result.imageUrl,
          position: payload,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "تعذر حفظ الصورة وتنسيقها";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    handleZoomChange(1);
    setFocalPoint({ x: 50, y: 50, zoom: 1 });
  };

  if (!activeSrc) return null;

  const isNewUpload = Boolean(imageFile);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card" dir="rtl">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          {isNewUpload ? "تنسيق وحفظ الصورة الجديدة" : "تنسيق الصورة"}
        </h3>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          اسحب الصورة لتحديد الجزء الذي يظهر، واستخدم شريط التكبير لضبط الحجم المناسب ثم اضغط حفظ.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* منطقة السحب والتكبير التفاعلية */}
        <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-inner sm:h-80 lg:col-span-2">
          <Cropper
            image={activeSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={handleZoomChange}
            onCropComplete={onCropComplete}
            showGrid={true}
          />
        </div>

        {/* قسم المعاينة الحية الفورية (Live Preview) */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-4">
          <span className="text-xs font-bold text-muted">معاينة كما ستظهر في الكروت والبروفايل</span>
          
          <div className="relative aspect-4/3 w-40 overflow-hidden rounded-xl border border-border bg-accent/10 shadow-sm sm:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSrc}
              alt="معاينة الكارت"
              className="h-full w-full object-cover transition-transform duration-100 will-change-transform"
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${focalPoint.x}% ${focalPoint.y}%`,
              }}
            />
          </div>

          <div className="text-center font-mono text-xs text-muted">
            X: {focalPoint.x}% | Y: {focalPoint.y}% | زووم: {zoom.toFixed(1)}x
          </div>
        </div>
      </div>

      {/* شريط التحكم في التكبير والتصغير */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background p-3">
        <label htmlFor="zoom-range" className="shrink-0 text-xs font-bold text-foreground">
          التكبير ({zoom.toFixed(1)}x):
        </label>
        <input
          id="zoom-range"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer accent-accent"
        />
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground active:scale-95"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>

      {/* رسائل التنبيه */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-action/30 bg-action/10 p-3 text-xs font-semibold text-action">
          <IconCheck className="h-4 w-4 shrink-0" />
          <span>تم حفظ الصورة وتنسيقها بنجاح!</span>
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted/10 active:scale-95 disabled:opacity-50"
          >
            إلغاء
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {saving ? (isNewUpload ? "جاري رفع وحفظ الصورة..." : "جاري الحفظ...") : (isNewUpload ? "حفظ وتثبيت الصورة" : "حفظ التنسيق")}
        </button>
      </div>
    </div>
  );
}
