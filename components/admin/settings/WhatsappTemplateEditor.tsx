"use client";

import { IconWhatsApp } from "@/components/shared/icons";

interface WhatsappTemplateEditorProps {
  adminTemplate: string;
  onAdminTemplateChange: (val: string) => void;
  directTemplate: string;
  onDirectTemplateChange: (val: string) => void;
}

export function WhatsappTemplateEditor({
  adminTemplate,
  onAdminTemplateChange,
  directTemplate,
  onDirectTemplateChange,
}: WhatsappTemplateEditorProps) {
  const insertToken = (
    currentVal: string,
    token: string,
    setter: (val: string) => void,
  ) => {
    setter(`${currentVal} ${token}`.trim());
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="font-heading text-base font-bold text-foreground">
          قوالب رسائل الواتساب التلقائية (WhatsApp Templates)
        </h3>
        <p className="text-xs text-muted">
          تخصيص نص الرسائل التلقائية التي يفتحها تطبيق الواتساب للعميل. يمكنك
          استخدام المتغيرات الذكية ليتم استبدالها تلقائياً باسم الفني وتخصصه.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* قالب رسالة الإدارة */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-background/40 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="whatsapp-admin-template"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <IconWhatsApp className="h-4 w-4 text-action" />
                <span>رسالة الإدارة (عند تشغيل التحويل):</span>
              </label>

              {/* أزرار إضافة المتغيرات */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    insertToken(
                      adminTemplate,
                      "{اسم_الفني}",
                      onAdminTemplateChange,
                    )
                  }
                  className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
                >
                  + {`{اسم_الفني}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertToken(
                      adminTemplate,
                      "{التخصص}",
                      onAdminTemplateChange,
                    )
                  }
                  className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
                >
                  + {`{التخصص}`}
                </button>
              </div>
            </div>

            <textarea
              id="whatsapp-admin-template"
              rows={4}
              value={adminTemplate}
              onChange={(e) => onAdminTemplateChange(e.target.value)}
              placeholder="اكتب نص الرسالة..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </div>

          <p className="text-xs text-muted">
            تصل لمسؤول الإدارة المحدد متضمنة تفاصيل الفني المطلوب.
          </p>
        </div>

        {/* قالب رسالة التواصل المباشر مع الفني */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-background/40 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="whatsapp-direct-template"
                className="flex items-center gap-1.5 text-xs font-bold text-foreground"
              >
                <IconWhatsApp className="h-4 w-4 text-action" />
                <span>رسالة التواصل المباشر مع الصانع:</span>
              </label>

              {/* أزرار إضافة المتغيرات */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    insertToken(
                      directTemplate,
                      "{اسم_الفني}",
                      onDirectTemplateChange,
                    )
                  }
                  className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
                >
                  + {`{اسم_الفني}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertToken(
                      directTemplate,
                      "{التخصص}",
                      onDirectTemplateChange,
                    )
                  }
                  className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
                >
                  + {`{التخصص}`}
                </button>
              </div>
            </div>

            <textarea
              id="whatsapp-direct-template"
              rows={4}
              value={directTemplate}
              onChange={(e) => onDirectTemplateChange(e.target.value)}
              placeholder="اكتب نص الرسالة المباشرة..."
              className="w-full rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </div>

          <p className="text-xs text-muted">
            تظهر تلقائياً عندما يضغط العميل على واتساب الفني مباشرة.
          </p>
        </div>
      </div>
    </div>
  );
}
