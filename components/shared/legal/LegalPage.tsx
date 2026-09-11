import type { LegalDoc } from "@/lib/data/legal";

// صفحة المحتوى القانوني الثابت — بنفس نمط بقية صفحات الموقع
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <p className="text-sm font-bold text-muted">
            دليل الصنايعية · السويس
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold sm:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            {doc.description}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        {doc.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="mb-8 scroll-mt-24"
          >
            <h2 className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.blocks.map((block, i) =>
                block.type === "list" ? (
                  <ul
                    key={i}
                    className="list-disc space-y-1.5 text-base leading-relaxed text-muted ps-5"
                  >
                    {block.items.map((item, j) => (
                      <li key={j} className="marker:text-accent">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    key={i}
                    className="text-base leading-relaxed text-muted"
                  >
                    {block.text}
                  </p>
                ),
              )}
            </div>
          </section>
        ))}

        <p className="border-t border-border pt-4 text-xs text-muted">
          آخر تحديث: {doc.lastUpdated}
        </p>
      </div>
    </>
  );
}