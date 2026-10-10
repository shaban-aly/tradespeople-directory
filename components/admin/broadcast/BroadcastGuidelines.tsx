import { IconBell, IconCheck, IconLock } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export function BroadcastGuidelines() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <IconBell className="h-3.5 w-3.5" />
        </div>
        <h3 className="font-heading text-sm font-bold text-foreground">
          معلومات وضوابط هامة
        </h3>
      </div>
      <ul className="space-y-3 text-xs leading-relaxed text-muted">
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>يصل الإشعار للمستخدمين المحددين فور الإرسال مباشرةً داخل التطبيق.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>المستخدمون المفعّلون لإشعارات الويب/الهاتف سيتلقون إشعاراً خارجياً منبثقاً (Push Notification).</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>
            لكل مشرف حد أقصى {toArabicDigits(10)} إشعارات فقط كل ساعة لحماية المستخدمين من الإزعاج.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>
            الرابط اختياري ويجب أن يكون مساراً داخلياً يبدأ بـ <code className="rounded bg-muted/15 px-1.5 py-0.5 font-mono text-foreground" dir="ltr">/</code> (مثل <code className="rounded bg-muted/15 px-1.5 py-0.5 font-mono text-foreground" dir="ltr">/categories</code> أو <code className="rounded bg-muted/15 px-1.5 py-0.5 font-mono text-foreground" dir="ltr">/favorites</code>).
          </span>
        </li>
      </ul>
    </div>
  );
}
