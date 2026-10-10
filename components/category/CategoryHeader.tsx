import Link from "next/link";
import { toArabicDigits } from "@/lib/utils/format";
import { IconGrid, IconUsers, IconShieldCheck } from "@/components/shared/icons";

interface CategoryHeaderProps {
  categoriesCount: number;
  totalCraftsmen: number;
  activeCount: number;
}

export function CategoryHeader({
  categoriesCount,
  totalCraftsmen,
  activeCount,
}: CategoryHeaderProps) {
  return (
    <header className="border-b border-border/80 bg-card/60 backdrop-blur-xs">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        {/* مسار التصفح (Breadcrumb) */}
        <nav
          aria-label="مسار التصفح"
          className="flex items-center gap-2 text-xs font-medium text-muted"
        >
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
            الرئيسية
          </Link>
          <span className="text-border" aria-hidden="true">/</span>
          <span className="text-foreground font-semibold">كل التصنيفات</span>
        </nav>

        {/* العنوان الرئيسي والوصف */}
        <div className="mt-4 flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
           التخصصات والتصنيفات
          </h1>
          <p className="max-w-2xl text-base text-muted leading-relaxed">
تصفح التخصصات المتوفرة في دليل الصنايعية.          </p>
        </div>

        {/* شارات الإحصائيات السريعة */}
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-foreground">
            <IconGrid className="h-3.5 w-3.5 text-accent" />
            <span>{toArabicDigits(categoriesCount)} تخصص متاح</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-foreground">
            <IconUsers className="h-3.5 w-3.5 text-action" />
            <span>{toArabicDigits(totalCraftsmen)} صنايعي مسجل</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent">
            <IconShieldCheck className="h-3.5 w-3.5" />
            <span>{toArabicDigits(activeCount)} تخصص متاح للطلب الفوري</span>
          </div>
        </div>
      </div>
    </header>
  );
}
