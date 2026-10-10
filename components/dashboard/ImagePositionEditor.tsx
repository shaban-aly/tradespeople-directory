"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area, type Point } from "react-easy-crop";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import { saveCraftsmanAvatarStandalone } from "@/lib/db/craftsman-mutations";
import { revalidateProfileAfterSave } from "@/app/dashboard/actions";
import { IconCheck, IconRefresh } from "@/components/shared/icons";
import { supabaseTransformUrl } from "@/lib/utils/image-transform";

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
  // توليد رابط محلي فوري للملف الجديد. الاشتقاق بـ useMemo يتفادى setState
  // in the effect (وريندراً إضافياً)، و effect منفصل للإلغاء فقط.
  const objectUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    if (!objectUrl) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const activeSrc = objectUrl || imageUrl || "";

  // محرر القصّ يحتاج دقة كافية لتحديد نقطة التركيز، لكن ليس صورة 1200px كاملة:
  // 800px تكفي تماماً، والمعاينة المصغّرة تستخدم نسخة 240px مقصوصة 4:3.
  const cropperSrc = objectUrl ?? supabaseTransformUrl(imageUrl, { width: 800 }) ?? "";
  const previewSrc =
    objectUrl ??
    supabaseTransformUrl(imageUrl, { width: 240, height: 180, resize: "cover" }) ??
    "";

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
    <div className="flex flex-col gap-4" dir="rtl">
      {/* شبكة العمل: منطقة القص التفاعلية بكامل الصورة + المعاينة الحية لكارت الدليل 4:3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* منطقة السحب والقص التفاعلية — تعرض الصورة الأصلية كاملة لتحديد أي جزء منها بدقة */}
        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-inner sm:h-80 lg:col-span-2">
          <Cropper
            image={cropperSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={handleZoomChange}
            onCropComplete={onCropComplete}
            showGrid={true}
          />
        </div>

        {/* كارت المعاينة الحية الفورية لكيفية ظهور الصورة في كروت الدليل والبروفايل */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-background/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-foreground">
            المعاينة الحية (كارت الدليل 4:3)
          </span>

          <div className="relative aspect-4/3 w-44 overflow-hidden rounded-xl border border-border/80 bg-accent/10 shadow-sm sm:w-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="معاينة كارت الدليل"
              width={208}
              height={156}
              className="h-full w-full object-cover transition-transform duration-100 will-change-transform"
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                transform: zoom > 1 ? `scale(${zoom})` : undefined,
                transformOrigin: `${focalPoint.x}% ${focalPoint.y}%`,
              }}
            />
          </div>

          <div className="text-center font-mono text-xs text-muted" dir="ltr">
            X: {focalPoint.x}% | Y: {focalPoint.y}% | {zoom.toFixed(1)}x
          </div>
          <p className="text-xs text-center text-muted leading-tight">
            هكذا ستظهر صورتك للعملاء بعد تطبيق أبعاد وقص سوبابيز التلقائي
          </p>
        </div>
      </div>

      {/* شريط التحكم في التكبير والتصغير وإعادة الضبط */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-2.5 sm:p-3">
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
          className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground active:scale-95"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>

      {/* رسائل التنبيه والنجاح */}
      {errorMsg && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-semibold text-danger">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-action/30 bg-action/10 p-3 text-xs font-semibold text-action">
          <IconCheck className="h-4 w-4 shrink-0" />
          <span>تم حفظ الصورة وتنسيقها بنجاح!</span>
        </div>
      )}

      {/* أزرار الإجراءات: حفظ التنسيق أو إلغاء والعودة للوضع الطبيعي */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/10 active:scale-95 disabled:opacity-50"
          >
            إلغاء التعديل
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs sm:text-sm font-bold text-on-accent shadow-xs transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>{isNewUpload ? "جاري رفع الصورة..." : "جاري الحفظ..."}</span>
            </>
          ) : (
            <>
              <IconCheck className="h-4 w-4" />
              <span>{isNewUpload ? "حفظ وتثبيت الصورة" : "حفظ التنسيق والموضع"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
