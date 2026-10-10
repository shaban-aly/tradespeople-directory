import {
  IconGlobe,
  IconHeartHandshake,
  IconSparkles,
  IconTrendingUp,
} from "@/components/shared/icons";

export function AboutStory() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* العمود الأيمن: سرد القصة */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              حكايتنا: كيف بدأت الفكرة ولماذا السويس؟
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-muted">
              إحنا مجموعة شباب من أبناء محافظة السويس، عشنا نفس المعاناة اللي بيعيشها كل بيت سويسي: ماسورة ضربت ومحتاجين سباك ضروري في نص الليل، لوحة مفاتيح فصلت ومطلوب كهربائي أمين، أو بنجهز شقة وبندور على نجار أو نقاش شغله نظيف وملتزم بمواعيده.
            </p>

            <p className="text-base leading-relaxed text-muted">
              كنا دايماً بنسأل في جروبات السوشيال ميديا أو نلف على المعارف؛ وكتير ما كانت تضيع الساعات في أرقام غير صحيحة، أو تجارب عشوائية تفتقر لأي معيار من الثقة والشفافية.
            </p>

            <p className="text-base leading-relaxed text-muted">
              الفكرة نفسها مش جديدة في العالم؛ المنصات والأدلة الرقمية للحرفيين قائمة ومثبتة نجاحها الكبير في دول أوروبية وعربية مجاورة، وبدأت تحقق انتشاراً ملحوظاً في عدة محافظات مصرية. لكن كان السؤال اللي دايماً بيشغلنا: <strong className="text-foreground">ليه السويس متكونش سبّاقة بمنظومة محلية متكاملة تليق بأهلها؟</strong>
            </p>

            <p className="text-base leading-relaxed text-muted">
              السويس مدينة عظيمة بتماسك أهلها ووعيهم، وتستحق منصة مصممة خصيصاً لها، تفهم طبيعة أحيائها (الأربعين، فيصل، السويس، عتاقة، الجناين)، وتقدم تجربة خفيفة وسريعة على الموبايل تناسب كل فرد في العائلة بدون أي تعقيد تقني.
            </p>
          </div>

          {/* العمود الأيسر: كروت الرؤية والتشجيع الوطني */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card transition-all hover:border-accent/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <IconHeartHandshake className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  نشجع منتج بلدنا وشبابنا
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                فخورين بأن المشروع فكرة وتصميم وتطوير وتدقيق شباب مصريين من أبناء السويس. هدفنا نثبت إننا نقدر نبني حلولاً رقمية تفيد مجتمعنا وتضاهي أفضل النماذج الإقليمية.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card transition-all hover:border-action/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action/10 text-action">
                  <IconGlobe className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  فكرة مجرّبة بروح محلية
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                استلهمنا أفضل الممارسات من منصات الخدمات العالمية والعربية، وطوعناها بنسبة ١٠٠٪ لتناسب طبيعة السويس وثقافة الاتصال المباشر عبر الهاتف وواتساب.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card transition-all hover:border-accent/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <IconTrendingUp className="h-5 w-5" />
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  دعم الصنايعي الأصيل
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                الصنايعي الشاطر هو عمود أساسي في المجتمع. نوفر له واجهة رقمية مشرفة توصله بزبائن جدد كل يوم في منطقته بدون ما يدفع أي عمولة أو اشتراك.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
