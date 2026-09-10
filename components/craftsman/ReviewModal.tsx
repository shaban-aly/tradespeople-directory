"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/ui/Modal";
import { Button } from "@/components/shared/ui/Button";
import { IconStar } from "@/components/shared/icons";
import { upsertReview, type ReviewItem } from "@/lib/db/reviews";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  craftsmanId: string;
  craftsmanName: string;
  userId: string;
  userName: string;
  existingReview?: ReviewItem | null;
  onSuccess: () => void;
}

export function ReviewModal({
  open,
  onClose,
  craftsmanId,
  craftsmanName,
  userId,
  userName,
  existingReview,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
    setError(null);
  }, [existingReview, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("يرجى اختيار تقييم من 1 إلى 5 نجوم");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await upsertReview({
      userId,
      craftsmanId,
      rating,
      comment,
      userName,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "حدث خطأ أثناء حفظ التقييم");
    }
  }

  const activeRating = hoverRating || rating;

  const ratingDescriptions: Record<number, string> = {
    1: "تجربة سيئة جداً",
    2: "أقل من المتوقع",
    3: "مقبول إلى حد ما",
    4: "شغل ممتاز ومحترم",
    5: "ممتاز جداً وأنصح به بشدة ⭐",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existingReview ? "تعديل تقييمك" : "تقييم الصنايعي"}
      description={
        <>
          رأيك في شغل{" "}
          <span className="font-bold text-foreground">{craftsmanName}</span>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* اختيار النجوم */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-background/60 p-4 border border-border">
            <span className="text-xs text-muted font-medium">حدد مستوى رضاك:</span>
            <div className="flex items-center gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-120 active:scale-95"
                  aria-label={`${star} نجوم`}
                >
                  <IconStar
                    className={`h-8 w-8 transition-colors ${
                      star <= activeRating
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-bold text-accent min-h-5">
              {ratingDescriptions[activeRating]}
            </span>
          </div>

          {/* مربع التعليق */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="review-comment" className="text-sm font-bold text-foreground">
                اكتب تفاصيل تجربتك (اختياري)
              </label>
              <span className="text-xs text-muted">
                {comment.length}/500
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="احكي لنا عن التزامه بالمواعيد، جودة الشغل، الأمانة، والأسعار..."
              className="w-full rounded-2xl border border-border bg-background p-3.5 text-base text-foreground transition-colors focus:outline-none resize-none"
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="action"
              className="min-w-30 px-6"
              disabled={loading}
            >
              {loading
                ? "جاري الحفظ..."
                : existingReview
                  ? "تحديث التقييم"
                  : "نشر التقييم"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}