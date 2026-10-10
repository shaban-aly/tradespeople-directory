import {
  IconCheckCircle,
  IconHeartHandshake,
  IconLock,
  IconShieldCheck,
  IconUsers,
} from "@/components/shared/icons";

export function AboutValues() {
  const values = [
    {
      title: "مجانية مطلقة وبلا وسطاء",
      description:
        "لا نتقاضى أي نسبة أو عمولة من العميل ولا من الصنايعي . هدفنا تيسير سبل الرزق وتشجيع الاعتماد على الفني المحلي دون أي عبء مالي إضافي.",
      icon: IconShieldCheck,
    },
    {
      title: "الاعتزاز بمنتج بلدنا وبشبابنا",
      description:
        "نؤمن بأن شباب مصر قادرون على بناء وتطوير منصات برمجية فائقة الجودة تخدم مجتمعاتهم المحلية، وأن السويس زاخرة بالعقول والمهارات التي تستحق الدعم.",
      icon: IconHeartHandshake,
    },
    {
      title: "الشفافية والنزاهة المهنية",
      description:
        "لا نفرّق بين فني وآخر بمقابل مادي. الترتيب والظهور مبنيان على اكتمال الملف، دقة التوثيق، وتجارب الناس الحقيقية، مع باب مفتوح للإبلاغ عن أي تجاوز.",
      icon: IconCheckCircle,
    },
    {
      title: "احترام الخصوصية والأمان",
      description:
        "بياناتك محفوظة ولا يتم بيعها أو مشاركتها مع أي جهة إعلانية خارجية. نلتزم بأعلى معايير التشفير والحد الأدنى من جمع البيانات الشخصية.",
      icon: IconLock,
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
            مبادئنا التي لا نساوم عليها
          </h2>
          <p className="mt-3 text-base text-muted">
            القيم التي تحكم كل سطر برمجي وكل قرار نتخذه في إدارة وتطوير دليل الصنايعية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all hover:border-accent/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {v.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
