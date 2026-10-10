import {
  IconCheckCircle,
  IconDownload,
  IconLayoutDashboard,
  IconMapPin,
  IconMessageSquare,
  IconPhone,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
} from "@/components/shared/icons";

export function AboutFeatures() {
  const features = [
    {
      title: "تواصل مباشر وفوري",
      description:
        "اتصال هاتفي مباشر أو محادثة واتساب بنقرة زر واحدة، بدون وسيط وبدون أي انتظار أو تسجيل معقد.",
      icon: IconPhone,
      accent: "text-action bg-action/10",
    },
    {
      title: "خدمة «اطلب صنايعي»",
      description:
        "اكتب مشكلتك وتفاصيل الشغلانة وحدد منطقتك، وتصلك مكالمات وعروض مباشرة من الفنيين المتاحين في منطقتك فوراً.",
      icon: IconSparkles,
      accent: "text-accent bg-accent/10",
    },
    {
      title: "التوثيق والمراجعة اليدوية",
      description:
        "فريقنا يراجع ويدقق يدوياً أرقام الهواتف وتفاصيل كل فني لمنع الحسابات الوهمية، مع منح شارة «موثّق» للفنيين المعتمدين.",
      icon: IconShieldCheck,
      accent: "text-accent bg-accent/10",
    },
    {
      title: "تغطية جغرافية لأحياء السويس",
      description:
        "تصفية فورية حسب أحياء المحافظة: الأربعين، فيصل، السويس، عتاقة، والجناين؛ لتصل لأقرب فني لبيتك في أقل وقت.",
      icon: IconMapPin,
      accent: "text-action bg-action/10",
    },
    {
      title: "لوحة تحكم وإحصائيات للفني",
      description:
        "لوحة تحكم مجانية تمكّن الصنايعي من متابعة تفاعل الزبائن (المكالمات، رسائل الواتساب، والمشاهدات) وإدارة معرض أعماله بسهولة.",
      icon: IconLayoutDashboard,
      accent: "text-accent bg-accent/10",
    },
    {
      title: "تقييمات وتجارب واقعية شفافة",
      description:
        "آراء وتقييمات حقيقية من أهالي السويس تدعم الصنايعي الأمين وتساعد العميل على اختيار الفني الأنسب بثقة واطمئنان.",
      icon: IconMessageSquare,
      accent: "text-action bg-action/10",
    },
    {
      title: "بحث فوري واختصارات ذكية",
      description:
        "مودال بحث سريع بضغط مفتاح (Ctrl+K) وسجل للبحث المحلي للتنقل بين التخصصات والمناطق في لمح البصر.",
      icon: IconSearch,
      accent: "text-accent bg-accent/10",
    },
    {
      title: "تطبيق ويب تقدمي خفيف (PWA)",
      description:
        "منصة فائقة السرعة تعمل على أضعف شبكات المحمول، مع إمكانية تثبيتها كأيقونة على شاشة موبايلك بدون استهلاك مساحة.",
      icon: IconDownload,
      accent: "text-action bg-action/10",
    },
  ];

  return (
    <section className="border-y border-border/80 bg-card/40 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
            مميزات وإمكانيات دليل الصنايعية
          </h2>
          <p className="mt-3 text-base text-muted">
            صممنا كل ميزة في المنصة لتلبي احتياجاً حقيقياً في  السويس، ولتفتح آفاق عمل جديدة لكل صنايعي شاطر.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs transition-all hover:border-accent/50 hover:shadow-card"
              >
                <div>
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.description}
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
