"use client";

import { useState } from "react";
import { useAdminBroadcast, type BroadcastAudience } from "@/hooks/admin/useAdminBroadcast";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useToast } from "@/hooks/ui/useToast";
import { IconAlert, IconCheck } from "@/components/shared/icons";
import { UserSelect } from "./UserSelect";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { NotificationPreview } from "./NotificationPreview";
import { BroadcastGuidelines } from "./BroadcastGuidelines";
import { toArabicDigits } from "@/lib/utils/format";
import { isSafeInternalLink } from "@/lib/utils/internalLink";

export function BroadcastForm() {
  const { sendBroadcast, loading, error, successCount } = useAdminBroadcast();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserName, setTargetUserName] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast("error", "يرجى إدخال عنوان ونص الإشعار");
      return;
    }

    if (audience === "user_id" && !targetUserId.trim()) {
      toast("error", "يرجى اختيار مستخدم محدد");
      return;
    }

    const trimmedLink = link.trim();
    if (trimmedLink && !isSafeInternalLink(trimmedLink)) {
      toast("error", "الرابط يجب أن يكون مساراً داخلياً آمناً يبدأ بـ / (مثل /favorites)");
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
      setTargetUserName("");
    } else {
      toast("error", "فشل إرسال الإشعار");
    }
  };

  const getConfirmationMessage = () => {
    let audienceText = "كل المستخدمين المسجلين في التطبيق";
    if (audience === "craftsmen") audienceText = "جميع الفنيين المسجلين فقط";
    if (audience === "clients") audienceText = "جميع العملاء المسجلين فقط";
    if (audience === "user_id") {
      audienceText = targetUserName ? `المستخدم المحدد (${targetUserName})` : "المستخدم المحدد";
    }

    return `هل أنت متأكد من إرسال هذا الإشعار إلى ${audienceText}؟ سيصل الإشعار فوراً للأجهزة ولا يمكن التراجع عن هذه الخطوة.`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form Column */}
      <div className="lg:col-span-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/10 p-4 text-danger">
              <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {successCount !== null && (
            <div className="flex items-start gap-3 rounded-xl border border-action/25 bg-action/15 p-4 text-action">
              <IconCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">
                تم الإرسال بنجاح إلى {toArabicDigits(successCount)} مستخدم.
              </p>
            </div>
          )}

          <div className="space-y-5">
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
                  setTargetUserName("");
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                <UserSelect
                  value={targetUserId}
                  onChange={setTargetUserId}
                  onUserNameChange={setTargetUserName}
                />
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="title" className="block text-sm font-bold text-foreground">
                  عنوان الإشعار
                </label>
                <span className="text-xs text-muted" dir="ltr">
                  {toArabicDigits(title.length)} / {toArabicDigits(200)}
                </span>
              </div>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تحديث هام في دليل الصنايعية"
                maxLength={200}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="body" className="block text-sm font-bold text-foreground">
                  نص الإشعار
                </label>
                <span className="text-xs text-muted" dir="ltr">
                  {toArabicDigits(body.length)} / {toArabicDigits(1000)}
                </span>
              </div>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب نص الإشعار بالتفصيل هنا..."
                rows={4}
                maxLength={1000}
                className="custom-scrollbar w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                placeholder="/favorites أو /categories"
                maxLength={500}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
                dir="ltr"
              />
              <p className="mt-1.5 text-xs text-muted">
                يجب أن يكون مساراً داخلياً آمناً يبدأ بـ <code className="rounded bg-muted/15 px-1 py-0.5 font-mono text-foreground" dir="ltr">/</code> (مثل <code className="rounded bg-muted/15 px-1 py-0.5 font-mono text-foreground" dir="ltr">/favorites</code>).
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
            title="تأكيد إرسال الإشعار"
            message={getConfirmationMessage()}
            confirmLabel="نعم، أرسل الإشعار"
            danger={false}
          />
        </form>
      </div>

      {/* Preview and Info Sidebar */}
      <div className="lg:col-span-1 space-y-5">
        <NotificationPreview
          title={title}
          body={body}
          link={link}
          audience={audience}
          targetUserName={targetUserName}
        />
        <BroadcastGuidelines />
      </div>
    </div>
  );
}
