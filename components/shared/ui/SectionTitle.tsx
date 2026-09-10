import type { ReactNode } from "react";

// عنوان قسم مصغّر بلغة تصميم الهوم (شارة eyebrow + عناوين عريضة):
// يُستخدم داخل كروت الأقسام في صفحة التفاصيل (نبذة، روابط أخرى، ...).

interface SectionTitleProps {
  eyebrow?: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: string;
}

export function SectionTitle({
  eyebrow,
  icon,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">
          {icon && <span className="flex items-center justify-center">{icon}</span>}
          <span>{eyebrow}</span>
        </div>
      )}
      <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}