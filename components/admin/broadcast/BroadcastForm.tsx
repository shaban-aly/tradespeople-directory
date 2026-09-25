"use client";

import { useState } from "react";
import { useAdminBroadcast, type BroadcastAudience } from "@/hooks/admin/useAdminBroadcast";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useToast } from "@/hooks/ui/useToast";
import { IconAlert, IconCheck } from "@/components/shared/icons";
import { UserSelect } from "./UserSelect";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export function BroadcastForm() {
  const { sendBroadcast, loading, error, successCount } = useAdminBroadcast();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast("error", "يرجى إدخال عنوان ونص الإشعار");
      return;
    }

    if (audience === "user_id" && !targetUserId.trim()) {
      toast("error", "يرجى اختيار مستخدم");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsConfirmOpen(false);

    const success = await sendBroadcast({
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || undefined,
      audience,
      targetUserId: audience === "user_id" ? targetUserId.trim() : undefined,
    });

    if (success) {
      toast("success", "تم إرسال الإشعار بنجاح");
      setTitle("");
      setBody("");
      setLink("");
      setTargetUserId("");
    } else {
      toast("error", "فشل إرسال الإشعار");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-danger/10 p-4 text-danger">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {successCount !== null && (
        <div className="flex items-start gap-3 rounded-xl bg-green-500/10 p-4 text-green-600">
          <IconCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">تم الإرسال بنجاح إلى {successCount} مستخدم.</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="audience" className="mb-1.5 block text-sm font-bold text-foreground">
            الجمهور المستهدف
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as BroadcastAudience);
              setTargetUserId("");
            }}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          >
            <option value="all">كل المستخدمين (عملاء وفنيين)</option>
            <option value="craftsmen">الفنيين فقط</option>
            <option value="clients">العملاء فقط</option>
            <option value="user_id">مستخدم محدد</option>
          </select>
        </div>

        {audience === "user_id" && (
          <div>
            <label className="mb-1.5 block text-sm font-bold text-foreground">
              اختر المستخدم
            </label>
            <UserSelect value={targetUserId} onChange={setTargetUserId} />
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-foreground">
            عنوان الإشعار
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تحديث جديد في التطبيق"
            maxLength={200}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1.5 block text-sm font-bold text-foreground">
            نص الإشعار
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب تفاصيل الإشعار هنا..."
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent custom-scrollbar"
          />
        </div>

        <div>
          <label htmlFor="link" className="mb-1.5 block text-sm font-bold text-foreground">
            الرابط عند النقر (اختياري)
          </label>
          <input
            type="text"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="مثال: /favorites أو https://example.com"
            maxLength={500}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            dir="ltr"
          />
          <p className="mt-1 text-[11px] text-muted">
            يمكنك وضع رابط داخلي أو رابط خارجي يبدأ بـ http
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <AdminButton type="submit" disabled={loading} className="w-full">
          {loading ? "جاري الإرسال..." : "إرسال الإشعار"}
        </AdminButton>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="تأكيد الإرسال الجماعي"
        message="هل أنت متأكد من إرسال هذا الإشعار؟ سيتم الإرسال فوراً ولا يمكن التراجع عن هذه الخطوة."
        confirmLabel="نعم، أرسل الإشعار"
        danger={false}
      />
    </form>
  );
}
