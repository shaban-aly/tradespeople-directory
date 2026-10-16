"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateContactRoutingAction } from "@/app/actions/admin-settings";
import { useToast } from "@/hooks/ui/useToast";
import {
  resolveAdminContactForCraftsman,
  renderWhatsappTemplate,
  type ContactRoutingSettings,
  type AdminPhoneNumber,
} from "@/lib/db/settings";

export function useAdminSettings(initialSettings: ContactRoutingSettings) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<ContactRoutingSettings>(initialSettings);

  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [adminNumbers, setAdminNumbers] = useState<AdminPhoneNumber[]>(
    initialSettings.admin_numbers || [],
  );
  const [whatsappAdminTemplate, setWhatsappAdminTemplate] = useState(
    initialSettings.whatsapp_admin_template || "",
  );
  const [whatsappDirectTemplate, setWhatsappDirectTemplate] = useState(
    initialSettings.whatsapp_direct_template || "",
  );

  // مزامنة الحالة المرجعية والمدخلات عند تحديث initialSettings من السيرفر (بعد router.refresh)
  useEffect(() => {
    setBaseline(initialSettings);
  }, [initialSettings]);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();

  // أدوات محاكاة واختبار التوجيه الفوري
  const [simName, setSimName] = useState("محمد السباك");
  const [simCategory, setSimCategory] = useState("سباكة");

  // إضافة رقم جديد
  const addNumber = () => {
    const nextIdx = adminNumbers.length + 1;
    const newId = `admin-${Date.now()}`;
    setAdminNumbers((prev) => [
      ...prev,
      {
        id: newId,
        phone: "",
        label: `خط الإدارة ${nextIdx}`,
        active: true,
      },
    ]);
  };

  // حذف رقم
  const removeNumber = (id: string) => {
    if (adminNumbers.length <= 1) {
      toast("error", "يجب الإبقاء على رقم إدارة واحد على الأقل");
      return;
    }
    setAdminNumbers((prev) => prev.filter((item) => item.id !== id));
  };

  // تعديل بيانات رقم
  const updateNumber = (id: string, updates: Partial<AdminPhoneNumber>) => {
    setAdminNumbers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  // تبديل حالة نشاط رقم
  const toggleActive = (id: string) => {
    setAdminNumbers((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );
  };

  // كشف وجود تعديلات غير محفوظة بمقارنتها بالحالة المرجعية المحفوظة
  const isDirty = useMemo(() => {
    if (enabled !== baseline.enabled) return true;
    if (
      whatsappAdminTemplate.trim() !==
      (baseline.whatsapp_admin_template || "").trim()
    )
      return true;
    if (
      whatsappDirectTemplate.trim() !==
      (baseline.whatsapp_direct_template || "").trim()
    )
      return true;

    if (adminNumbers.length !== (baseline.admin_numbers || []).length) return true;

    for (let i = 0; i < adminNumbers.length; i++) {
      const cur = adminNumbers[i];
      const init = baseline.admin_numbers[i];
      if (!init) return true;
      if (
        cur.phone.trim() !== init.phone.trim() ||
        (cur.label || "").trim() !== (init.label || "").trim() ||
        cur.active !== init.active
      ) {
        return true;
      }
    }

    return false;
  }, [
    enabled,
    adminNumbers,
    whatsappAdminTemplate,
    whatsappDirectTemplate,
    baseline,
  ]);

  const currentSettings: ContactRoutingSettings = useMemo(
    () => ({
      enabled,
      admin_numbers: adminNumbers,
      whatsapp_admin_template: whatsappAdminTemplate,
      whatsapp_direct_template: whatsappDirectTemplate,
    }),
    [enabled, adminNumbers, whatsappAdminTemplate, whatsappDirectTemplate],
  );

  // حساب محاكاة التوجيه الفوري
  const simulationResult = useMemo(() => {
    const key = simName.trim() || "default";
    const resolved = resolveAdminContactForCraftsman(key, currentSettings);

    const adminMessage = renderWhatsappTemplate(whatsappAdminTemplate, {
      craftsmanName: simName.trim() || "صنايعي تجريبي",
      categoryName: simCategory.trim() || "عام",
    });

    const directMessage = renderWhatsappTemplate(whatsappDirectTemplate, {
      craftsmanName: simName.trim() || "صنايعي تجريبي",
      categoryName: simCategory.trim() || "عام",
    });

    return {
      slot: resolved.slot,
      label: resolved.label,
      phone: resolved.phone,
      whatsapp: resolved.whatsapp,
      adminMessage,
      directMessage,
    };
  }, [simName, simCategory, currentSettings, whatsappAdminTemplate, whatsappDirectTemplate]);

  // استعادة الإعدادات المحفوظة
  const reset = () => {
    setEnabled(baseline.enabled);
    setAdminNumbers(baseline.admin_numbers || []);
    setWhatsappAdminTemplate(baseline.whatsapp_admin_template || "");
    setWhatsappDirectTemplate(baseline.whatsapp_direct_template || "");
    setErrorMsg("");
  };

  // حفظ الإعدادات في Supabase
  const saveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const validPhones = adminNumbers.filter((n) => n.phone.trim().length > 0);
    if (validPhones.length === 0) {
      const err = "يرجى إدخال رقم هاتف واحد على الأقل";
      setErrorMsg(err);
      toast("error", err);
      return false;
    }

    const activeCount = adminNumbers.filter(
      (n) => n.active && n.phone.trim().length > 0,
    ).length;
    if (enabled && activeCount === 0) {
      const err = "لا يمكن تشغيل التحويل بدون تفعيل خط نشط واحد على الأقل";
      setErrorMsg(err);
      toast("error", err);
      return false;
    }

    setBusy(true);

    try {
      const res = await updateContactRoutingAction({
        enabled,
        admin_numbers: adminNumbers,
        whatsapp_admin_template: whatsappAdminTemplate,
        whatsapp_direct_template: whatsappDirectTemplate,
      });

      if (res.success) {
        toast("success", "تم حفظ إعدادات الاتصالات ورسائل الواتساب بنجاح");
        setBaseline({
          enabled,
          admin_numbers: adminNumbers,
          whatsapp_admin_template: whatsappAdminTemplate,
          whatsapp_direct_template: whatsappDirectTemplate,
        });
        router.refresh();
        return true;
      } else {
        const err = res.error || "فشل حفظ الإعدادات";
        setErrorMsg(err);
        toast("error", err);
        return false;
      }
    } catch {
      const err = "حدث خطأ غير متوقع أثناء الحفظ";
      setErrorMsg(err);
      toast("error", err);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // تبديل فوري لتفعيل/تعطيل التحويل مع الحفظ المباشر في Supabase
  const toggleRouting = async (nextValue: boolean) => {
    if (nextValue) {
      const activeCount = adminNumbers.filter(
        (n) => n.active && n.phone.trim().length > 0,
      ).length;
      if (activeCount === 0) {
        toast("error", "لا يمكن تشغيل التحويل بدون تفعيل خط نشط واحد على الأقل");
        return;
      }
    }

    setEnabled(nextValue);
    setBusy(true);

    try {
      const res = await updateContactRoutingAction({
        enabled: nextValue,
        admin_numbers: adminNumbers,
        whatsapp_admin_template: whatsappAdminTemplate,
        whatsapp_direct_template: whatsappDirectTemplate,
      });

      if (res.success) {
        toast(
          "success",
          nextValue
            ? "تم تفعيل تحويل الاتصالات والرسائل للإدارة وحفظها في قاعدة البيانات"
            : "تم إيقاف التحويل وحفظ التغيير بنجاح",
        );
        setBaseline((prev) => ({ ...prev, enabled: nextValue }));
        router.refresh();
      } else {
        setEnabled(!nextValue);
        toast("error", res.error || "فشل حفظ حالة التحويل");
      }
    } catch {
      setEnabled(!nextValue);
      toast("error", "حدث خطأ غير متوقع أثناء الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return {
    // Master routing
    enabled,
    setEnabled,
    toggleRouting,

    // Admin Numbers management
    adminNumbers,
    addNumber,
    removeNumber,
    updateNumber,
    toggleActive,

    // Message Templates
    whatsappAdminTemplate,
    setWhatsappAdminTemplate,
    whatsappDirectTemplate,
    setWhatsappDirectTemplate,

    // Status
    busy,
    errorMsg,
    isDirty,

    // Actions
    reset,
    saveSettings,

    // Simulator
    simName,
    setSimName,
    simCategory,
    setSimCategory,
    simulationResult,
  };
}
