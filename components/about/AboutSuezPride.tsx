import { IconMapPin, IconSparkles, IconUsers } from "@/components/shared/icons";

export function AboutSuezPride() {
  const neighborhoods = [
    { name: "حي الأربعين", desc: "قلب السويس النابض وأكبرها كثافة ونشاطاً حرفياً" },
    { name: "حي فيصل", desc: "امتداد عمراني حيوي وتنوع في الخدمات السكنية" },
    { name: "حي السويس", desc: "عراقة المدينة والمركز التجاري والإداري والتاريخي" },
    { name: "حي عتاقة", desc: "المناطق الصناعية والمجمعات السكنية الحديثة والساحلية" },
    { name: "حي الجناين", desc: "طبيعة ريفية أصيلة ونمو سكني متزايد شمال المحافظة" },
  ];

  return (
    <section className="border-t border-border/80 bg-card/60 backdrop-blur-xs py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-accent/5 p-6 sm:p-10 lg:p-12 shadow-card">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-accent font-bold text-sm mb-3">
              <IconMapPin className="h-4.5 w-4.5" />
              <span>السويس بلد الصمود والعمل</span>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground">
              معاً نصنع الفارق في كل بيت وكل حي بالسويس
            </h2>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted">
              دليل الصنايعية مش مجرد موقع على الإنترنت؛ ده مساحة مجتمعية مشتركة لكل أهل السويس. نجاح الفكرة واستمرارها بيعتمد بنسبة ١٠٠٪ على وعيكم وتفاعلكم:
            </p>

            <div className="mt-6 space-y-3 text-base text-muted">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">
                  ١
                </span>
                <p>
                  <strong className="text-foreground">لو أنت صاحب صنعة أو صنايعي شاطر:</strong> مكانك وسيرتك المهنية هنا. انضم للدليل مجاناً وخلي أهالي منطقتك يوصلوا لك برقمك المباشر.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">
                  ٢
                </span>
                <p>
                  <strong className="text-foreground">لو أنت مواطن أو صاحب منزل:</strong> جرّب الدليل، اطلب صنايعي، واكتب رأيك وتقييمك الصادق بعد انتهاء الشغل عشان تساعد جارك وتكافئ الصنايعي  الأمين.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">
                  ٣
                </span>
                <p>
                  <strong className="text-foreground">شجع منتج بلدك وشباب بلدك:</strong> شارك الدليل مع أهلك ومعارفك في السويس، وساهم في بناء مجتمع محلي يدعم أبناءه ويكبر بيهم.
                </p>
              </div>
            </div>

            {/* بطاقات أحياء السويس */}
            <div className="mt-8 pt-8 border-t border-border/80">
              <h3 className="font-heading text-base font-bold text-foreground mb-4">
                تغطية شاملة لكافة أحياء ومناطق المحافظة:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {neighborhoods.map((n, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 text-center transition-colors hover:border-accent"
                  >
                    <div className="font-heading text-sm font-bold text-foreground">
                      {n.name}
                    </div>
                    <div className="mt-1 text-xs text-muted line-clamp-2">
                      {n.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
