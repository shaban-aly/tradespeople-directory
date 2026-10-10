"use client";

import type { OpenLead, ClaimedLead } from "@/lib/db/leads";
import { toArabicDigits } from "@/lib/utils/format";
import { useLeadsBoardFilter } from "@/hooks/leads/useLeadsBoardFilter";
import { LeadsMetricsGrid } from "@/components/dashboard/leads/LeadsMetricsGrid";
import { OpenLeadsLiveList } from "@/components/dashboard/leads/OpenLeadsLiveList";
import { ClaimedLeadCard } from "@/components/dashboard/leads/ClaimedLeadCard";
import { ClosedLeadsGroup } from "@/components/dashboard/leads/ClosedLeadsGroup";
import { PushEnableBanner } from "@/components/dashboard/leads/PushEnableBanner";
import { OtherProfilesAlert, type OtherProfileOpen } from "@/components/dashboard/leads/OtherProfilesAlert";

interface LeadsBoardViewProps {
  open: OpenLead[];
  activeClaimed: ClaimedLead[];
  closedClaimed: ClaimedLead[];
  otherClaimed: ClaimedLead[];
  otherProfiles: OtherProfileOpen[];
}

/**
 * لوحة عروض وطلبات الفني الذكية (LeadsBoardView):
 * - تتيح التبديل السلس بين الطلبات عبر كروت الإحصائيات أو أزرار التصفية.
 * - الأولوية التشغيلية: إن لم تكن هناك عروض مفتوحة وتوجد طلبات قيد التواصل،
 *   تظهر كروت طلبات التواصل وأرقام هواتف العملاء مباشرة في أعلى الشاشة دون أي هبوط.
 */
export function LeadsBoardView({
  open,
  activeClaimed,
  closedClaimed,
  otherClaimed,
  otherProfiles,
}: LeadsBoardViewProps) {
  const { filter, setFilter } = useLeadsBoardFilter({
    openCount: open.length,
    activeClaimedCount: activeClaimed.length,
  });

  const showOpen = filter === "all" || filter === "open";
  const showClaimed = filter === "all" || filter === "activeClaimed";
  const showClosed = filter === "all" || filter === "closedClaimed";

  // ترتيب ذكي عند عرض الكل: إن كانت العروض المفتوحة فارغة، تُقدّم طلبات التواصل الجارية للأعلى
  const prioritizeClaimed = open.length === 0 && activeClaimed.length > 0;

  // قسم الطلبات المفتوحة
  const openSection = (
    <section aria-labelledby="open-leads-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="open-leads-heading" className="font-heading text-lg sm:text-xl font-bold text-foreground">
            طلبات العمل المتاحة في تخصصك
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            كن من أوائل الفنيين المستجيبين للتواصل مباشرة مع العميل في السويس
          </p>
        </div>
        {open.length > 0 && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
            {toArabicDigits(open.length)} متاح
          </span>
        )}
      </div>

      <OpenLeadsLiveList open={open} />

      {open.length === 0 && (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 text-center shadow-xs">
          <p className="font-heading text-base sm:text-lg font-bold text-foreground">
            لا توجد عروض عمل جديدة حالياً
          </p>
          <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed max-w-md mx-auto">
            سنرسل لك إشعاراً فورياً على هاتفك بمجرد قيام عميل في السويس بطلب فني في تخصصك.
          </p>
        </div>
      )}
    </section>
  );

  // قسم طلباتي المقبولة قيد التواصل
  const claimedSection = (
    <section aria-labelledby="claimed-leads-heading" className="space-y-4 pt-1" id="claimed-leads">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="claimed-leads-heading" className="font-heading text-lg sm:text-xl font-bold text-foreground">
            طلبات قمت بقبولها وتتواصل مع أصحابها
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            أرقام هواتف العملاء متاحة هنا للاتصال المباشر ومراسلتهم عبر واتساب
          </p>
        </div>
        {activeClaimed.length > 0 && (
          <span className="rounded-full bg-action/15 px-3 py-1 text-xs font-bold text-action border border-action/20">
            {toArabicDigits(activeClaimed.length)} جاري
          </span>
        )}
      </div>

      {activeClaimed.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {activeClaimed.map((lead) => (
            <ClaimedLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/70 text-center">
          <p className="text-sm font-semibold text-muted">
            لم تقبل أي طلب بعد — فور قبولك لأي طلب مفتوح ستظهر بيانات العميل ورقم هاتفه هنا فوراً.
          </p>
        </div>
      )}
    </section>
  );

  // قسم الأرشيف والطلبات السابقة
  const closedSection = (
    <section aria-labelledby="closed-leads-heading" className="space-y-4 pt-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="closed-leads-heading" className="font-heading text-lg sm:text-xl font-bold text-foreground">
            الطلبات السابقة والأرشيف
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            سجل الطلبات المنتهية أو المغلقة
          </p>
        </div>
        {closedClaimed.length > 0 && (
          <span className="rounded-full bg-muted/15 px-3 py-1 text-xs font-semibold text-muted">
            {toArabicDigits(closedClaimed.length)} طلب
          </span>
        )}
      </div>

      <ClosedLeadsGroup leads={closedClaimed} />
      <ClosedLeadsGroup
        leads={otherClaimed}
        title="طلبات مستلمة من ملفاتك المهنية الأخرى"
      />
    </section>
  );

  return (
    <div className="space-y-6">
      {/* 1. مصفوفة المؤشرات وفلاتر التبديل السريعة */}
      <LeadsMetricsGrid
        openCount={open.length}
        activeClaimedCount={activeClaimed.length}
        closedClaimedCount={closedClaimed.length}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* شريط أدوات التصفية والتبديل: سكرول أفقي سلس على الموبايل بدون التفاف */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap w-max min-w-full">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
              filter === "all"
                ? "bg-foreground text-background shadow-xs ring-1 ring-foreground/20"
                : "bg-card border border-border/70 text-muted hover:text-foreground hover:bg-muted/15 hover:border-border"
            }`}
          >
            عرض كل الأقسام
          </button>
          <button
            type="button"
            onClick={() => setFilter("activeClaimed")}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              filter === "activeClaimed"
                ? "bg-action text-white shadow-xs ring-1 ring-action/20"
                : "bg-card border border-border/70 text-muted hover:text-action hover:bg-action/5 hover:border-action/40"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-action shrink-0" />
            <span>قيد التواصل ({toArabicDigits(activeClaimed.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("open")}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              filter === "open"
                ? "bg-accent text-on-accent shadow-xs ring-1 ring-accent/20"
                : "bg-card border border-border/70 text-muted hover:text-accent hover:bg-accent/5 hover:border-accent/40"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
            <span>متاحة للرد ({toArabicDigits(open.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("closedClaimed")}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              filter === "closedClaimed"
                ? "bg-foreground text-background shadow-xs ring-1 ring-foreground/20"
                : "bg-card border border-border/70 text-muted hover:text-foreground hover:bg-muted/15 hover:border-border"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-muted shrink-0" />
            <span>السابقة ({toArabicDigits(closedClaimed.length)})</span>
          </button>
        </div>
      </div>

      {/* 2. تنبيهات الإشعارات والملفات المهنية الأخرى */}
      <div className="space-y-4">
        <PushEnableBanner />
        <OtherProfilesAlert items={otherProfiles} />
      </div>

      {/* 3. عرض الأقسام وفق الفلتر المحدد مع الترتيب الذكي */}
      <div className="space-y-6">
        {filter === "all" ? (
          prioritizeClaimed ? (
            <>
              {claimedSection}
              <div className="border-t border-border/70 pt-4">
                {openSection}
              </div>
              <div className="border-t border-border/70 pt-4">
                {closedSection}
              </div>
            </>
          ) : (
            <>
              {openSection}
              <div className="border-t border-border/70 pt-4">
                {claimedSection}
              </div>
              <div className="border-t border-border/70 pt-4">
                {closedSection}
              </div>
            </>
          )
        ) : (
          <>
            {showClaimed && claimedSection}
            {showOpen && openSection}
            {showClosed && closedSection}
          </>
        )}
      </div>
    </div>
  );
}
