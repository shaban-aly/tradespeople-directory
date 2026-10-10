import Link from "next/link";
import type { Category } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconMapPin, IconShieldCheck, IconUsers } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import { categoryColor } from "@/lib/utils/categoryColor";

interface CategoryDetailHeaderProps {
  category: Category;
  craftsmenCount: number;
  verifiedCount: number;
  coveredAreasCount: number;
}

export function CategoryDetailHeader({
  category,
  craftsmenCount,
  verifiedCount,
  coveredAreasCount,
}: CategoryDetailHeaderProps) {
  const color = categoryColor(category.slug);

  return (
    <header className="relative overflow-hidden border-b border-border/80 bg-card/60 backdrop-blur-xs">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-accent/5 via-transparent to-card/40"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        {/* مسار التصفح الدلالي (Breadcrumb) */}
        <nav
          aria-label="مسار التصفح"
          className="flex items-center gap-2 text-xs font-medium text-muted"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span className="text-border" aria-hidden="true">/</span>
          <Link
            href="/categories"
            className="hover:text-foreground transition-colors"
          >
            كل التصنيفات
          </Link>
          <span className="text-border" aria-hidden="true">/</span>
          <span className="text-foreground font-semibold">{category.name}</span>
        </nav>

        {/* العنوان وتفاصيل التخصص */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-2xs transition-transform duration-300 hover:scale-105 sm:h-20 sm:w-20"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
              color,
            }}
          >
            <CategoryIcon
              name={category.icon}
              className="h-9 w-9 sm:h-11 sm:w-11"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              صنايعية {category.name} في السويس
            </h1>
            <p className="mt-2 max-w-2xl text-base text-muted leading-relaxed">
              تصفح أمهر فنيين وورش{" "}
              {category.plural_name || category.singular_name || category.name}، قارن
              بين التقييمات ومناطق الخدمة، وتواصل مع الفني مباشرة — بدون أي وسيط.
            </p>
          </div>
        </div>

        {/* شارات الإحصائيات الدقيقة */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-2xs">
            <IconUsers className="h-3.5 w-3.5 text-accent" />
            <span>
              {toArabicDigits(craftsmenCount)}{" "}
              {craftsmenCount === 1 ? "صنايعي مسجل" : "صنايعي مسجلين"}
            </span>
          </div>

          {verifiedCount > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-action/25 bg-action/10 px-3.5 py-1.5 text-xs font-bold text-action shadow-2xs">
              <IconShieldCheck className="h-3.5 w-3.5" />
              <span>{toArabicDigits(verifiedCount)} فني موثّق</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-bold text-muted shadow-2xs">
            <IconMapPin className="h-3.5 w-3.5 text-muted" />
            <span>
              {toArabicDigits(coveredAreasCount)}{" "}
              {coveredAreasCount === 1 ? "منطقة مغطاة" : "مناطق مغطاة"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
