"use client";

import { useAdminSettings } from "@/hooks/admin/useAdminSettings";
import { RoutingStatusHeader } from "./RoutingStatusHeader";
import { AdminNumbersList } from "./AdminNumbersList";
import { WhatsappTemplateEditor } from "./WhatsappTemplateEditor";
import { RoutingDistributionVisualizer } from "./RoutingDistributionVisualizer";
import { RoutingSimulator } from "./RoutingSimulator";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconAlert, IconCheck } from "@/components/shared/icons";
import type { ContactRoutingSettings } from "@/lib/db/settings";

interface ContactRoutingSettingsCardProps {
  initialSettings: ContactRoutingSettings;
}

export function ContactRoutingSettingsCard({
  initialSettings,
}: ContactRoutingSettingsCardProps) {
  const {
    enabled,
    toggleRouting,
    adminNumbers,
    addNumber,
    removeNumber,
    updateNumber,
    toggleActive,
    whatsappAdminTemplate,
    setWhatsappAdminTemplate,
    whatsappDirectTemplate,
    setWhatsappDirectTemplate,
    busy,
    errorMsg,
    isDirty,
    reset,
    saveSettings,
    simName,
    setSimName,
    simCategory,
    setSimCategory,
    simulationResult,
  } = useAdminSettings(initialSettings);

  return (
    <form
      onSubmit={saveSettings}
      className="divide-y divide-border/70 overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-shadow"
    >
      {/* 1. قسم التحكم الرئيسي في تفعيل/تعطيل التحويل (حفظ فوري مباشر عند التبديل) */}
      <RoutingStatusHeader
        enabled={enabled}
        onToggle={toggleRouting}
        disabled={busy}
      />

      {/* 2. قائمة أرقام الإدارة المركزية ودعم أي عدد من الأرقام */}
      <div className="p-6">
        <AdminNumbersList
          numbers={adminNumbers}
          onAdd={addNumber}
          onRemove={removeNumber}
          onUpdate={updateNumber}
          onToggleActive={toggleActive}
        />
      </div>

      {/* 3. التمثيل المرئي لتوزيع الحمل على الأرقام النشطة */}
      <div className="p-6">
        <RoutingDistributionVisualizer numbers={adminNumbers} />
      </div>

      {/* 4. محرر قوالب رسائل الواتساب */}
      <div className="p-6">
        <WhatsappTemplateEditor
          adminTemplate={whatsappAdminTemplate}
          onAdminTemplateChange={setWhatsappAdminTemplate}
          directTemplate={whatsappDirectTemplate}
          onDirectTemplateChange={setWhatsappDirectTemplate}
        />
      </div>

      {/* 5. أداة المحاكاة والتجربة الحية */}
      <div className="p-6">
        <RoutingSimulator
          simName={simName}
          setSimName={setSimName}
          simCategory={simCategory}
          setSimCategory={setSimCategory}
          result={simulationResult}
          routingEnabled={enabled}
        />
      </div>

      {/* 6. شريط الإجراءات وحفظ التغييرات في قاعدة البيانات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/40 p-6">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">
              <IconAlert className="h-4 w-4 shrink-0" />
              <span>توجد تغييرات غير محفوظة في الإعدادات</span>
            </span>
          ) : (
            <span className="text-xs text-muted">
              جميع الأرقام والقوالب محفوظة ومطبقة لحظياً من قاعدة البيانات.
            </span>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-danger">{errorMsg}</p>
        )}

        <div className="flex items-center gap-3 self-end sm:self-center">
          {isDirty && (
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={reset}
            >
              إلغاء التعديلات
            </AdminButton>
          )}

          <AdminButton
            type="submit"
            disabled={busy || (!isDirty && !errorMsg)}
            variant="primary"
            size="md"
            className="min-w-36"
          >
            {busy ? (
              "جاري الحفظ..."
            ) : (
              <>
                <IconCheck className="h-4 w-4" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </AdminButton>
        </div>
      </div>
    </form>
  );
}
