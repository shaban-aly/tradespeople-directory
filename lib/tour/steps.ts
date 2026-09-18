// تعريف خطوات الجولة التعريفية — بيانات خالصة (نصوص + مستهدفات) قابلة للاختبار.
// المستهدفات عبر data-tour selectors تُقرأ من الكومبوننتات المباشرة، والخطوات
// التي تعتمد على الموبايل/الديسكتوب تستخدم دالة resolve(isMobile).

export type TourId = "core" | "account";

/** نمط تفاعل المستخدم مع العنصر الحقيقي في الخطوة:
 * - `info`: عرض فقط (لا حاجة لتفاعل).
 * - `click-target`: المستخدم يضغط على العنصر المظلّل والجولة تتحقق من النتيجة.
 * - `manual`: المستخدم يجرّب العنصر بنفسه والجولة تتابع عند حدوث شرط (مثل التنقل لصفحة التفاصيل). */
export type TourStepInteraction = "info" | "click-target" | "manual";

export interface TourStep {
  id: string;
  tour: TourId;
  title: string;
  description: string;
  /** نمط التفاعل المطلوب مع العنصر الحقيقي (الافتراضي: عرض فقط) */
  interaction?: TourStepInteraction;
  /** وصف بديل للموبايل (مثل خطوة التنقل التي تظهر تحت الشريط السفلي) */
  mobileDescription?: string;
  /** CSS selector للمستهدف، أو دالة تحددها حسب الشاشة. غيابه = خطوة تعريفيّة بلا تظليل. */
  target?: string | ((isMobile: boolean) => string | null);
  /** تخطي التمرير البرمجي للمستهدف (مفيد للعناصر الثابتة مثل الهيدر والشريط السفلي) */
  skipScroll?: boolean;
  /** إن لم يوجد المستهدف في المدة المسموحة تُتجاوز الخطوة بدلاً من إغلاق الجولة */
  optional?: boolean;
  /** خطوة انتقال بين الصفحات (تُنفَّذ بالتنقل ثم تنتقل للتالية) */
  transition?: boolean;
}

export const CORE_TOUR_STEPS: TourStep[] = [
  {
    id: "intro",
    tour: "core",
    title: "أهلاً بيك في دليل الصنايعية",
    description:
      "هنا هتلاقي كل المهن في السويس — سباكة، كهرباء، تكييف، نجارة وأكتر. الجولة قصيرة هتعرّفك إزاي تلاقي الصنايعي اللي يناسبك وتكلمه في أقل من دقيقة.",
  },
  {
    id: "hero-search",
    tour: "core",
    title: "ابدأ بالبحث",
    description:
      "دوس على زرار البحث ده وجرّب تكتب أي كلمة — مثلاً (سباك) — وهتلاقي النتايج قدامك فوراً.",
    target: '[data-tour="hero-search"]',
    interaction: "click-target",
  },
  {
    id: "hero-search-tags",
    tour: "core",
    title: "أو اختار تخصص جاهز",
    description:
      "تحت البحث في تخصصات مختارة جاهزة — دوس على أي واحد وهيبني لك البحث بنفسه.",
    target: '[data-tour="hero-search-tags"]',
  },
  {
    id: "home-categories",
    tour: "core",
    title: "الكل مصنّف قدامك",
    description:
      "كل التخصصات الخدمية مقسمة في صور مصغرة واضحة — لو مش عارف تبدأ منين، ابدأ من هنا.",
    target: '[data-tour="home-categories"]',
  },
  {
    id: "craftsman-card",
    tour: "core",
    title: "ده كارت الصنايعي",
    description:
      "كل صنايعي ليه كارت فيه اسمه، تخصصه، منطقته، وتقييم العملاء. دوس على الكارت تفتح كل تفاصيله.",
    target: '[data-tour="craftsman-card-link"]',
    interaction: "manual",
  },
  {
    id: "card-contact",
    tour: "core",
    title: "تصل وتكلم فوراً",
    description:
      "زرار الاتصال ده بيدينك رقم الصنايعي مباشرة — من غير وسيط ولا عمولة. دوس عليه وجرّب.",
    target: '[data-tour="card-call"]',
    interaction: "click-target",
  },
  {
    id: "card-whatsapp",
    tour: "core",
    title: "وكمان واتساب جاهز",
    description:
      "الزرار الأخضر ده بيفتحلك محادثة واتساب مع الصنايعي برسالة جاهزة — لو مفضل تراسل بدل ما تتصل.",
    target: '[data-tour="card-whatsapp"]',
    interaction: "click-target",
    optional: true,
  },
  {
    id: "card-favorite",
    tour: "core",
    title: "احفظ اللي عجبك",
    description:
      "علامة النجمة دي بتضيف الصنايعي لمفضلتك — ترجعله في أي وقت من غير ما تدور عليه تاني. ولو حسابك متسجل، مفضلتك بتتزامن على كل أجهزتك.",
    target: '[data-tour="card-favorite"]',
    interaction: "click-target",
  },
  {
    id: "trust-strip",
    tour: "core",
    title: "ليه تثق فينا؟",
    description:
      "الخدمة مجانية بالكامل، وأرقام الصنايعية بيتم مراجعتها بنفسنا — الرقم اللي هتشوفه رقم شغال فعلاً.",
    target: '[data-tour="trust-strip"]',
  },
  {
    id: "navigation",
    tour: "core",
    title: "تنقّل بسهولة",
    description:
      "من القائمة دي فوق تقدر تتنقل بين الرئيسية والتصنيفات والمفضلة وحسابك.",
    mobileDescription:
      "الشريط ده تحت بيبقى معاك في كل صفحة — الرئيسية، التصنيفات، البحث، مفضلتك، وحسابك.",
    target: (isMobile) =>
      isMobile ? '[data-tour="bottom-nav"]' : '[data-tour="header-nav"]',
    skipScroll: true,
  },
  {
    id: "open-details",
    tour: "core",
    title: "خلينا نشوف صفحة الصنايعي",
    description:
      "كل صنايعي ليه صفحة كاملة فيها بياناته وتقييماته. اضغط متابعة وهنفتحلك صفحة أول صنايعي شفته.",
    transition: true,
  },
  {
    id: "details-header",
    tour: "core",
    title: "صفحة الصنايعي",
    description:
      "هنا بتلاقي صورة الصنايعي، اسمه، تخصصه، ومنطقته — وكمان علامة التوثيق لو موثّق.",
    target: '[data-tour="details-header"]',
  },
  {
    id: "details-contact",
    tour: "core",
    title: "كلمه بزرار الاتصال",
    description:
      "من زرار الاتصال ده توصل للرقم مباشرة — وفي الموبايل بيظهرلك شريط اتصال ثابت تحت طول ما بتتصفح.",
    target: (isMobile) =>
      isMobile ? '[data-tour="sticky-call-call"]' : '[data-tour="details-call"]',
    skipScroll: false,
    interaction: "click-target",
  },
  {
    id: "details-whatsapp",
    tour: "core",
    title: "ولو تحب تراسل واتساب",
    description:
      "الزرار ده بيفتح محادثة واتساب برسالة جاهزة فيها اسم الصنايعي والتخصص — واتصالك بيترصد عشان تتأكد إن الرقم شغال.",
    target: (isMobile) =>
      isMobile ? '[data-tour="sticky-call-whatsapp"]' : '[data-tour="details-whatsapp"]',
    skipScroll: false,
    interaction: "click-target",
    optional: true,
  },
  {
    id: "details-reviews",
    tour: "core",
    title: "آراء العملاء بتفرق",
    description:
      "تقييمات هنا من ناس اشتغلت معاه من قبلك — اقريها قبل ما تدوس اتصال، ولو عندك تجربة شاركها مع أهل السويس.",
    target: '[data-tour="details-reviews"]',
  },
];

export const ACCOUNT_TOUR_STEPS: TourStep[] = [
  {
    id: "account-bell",
    tour: "account",
    title: "الإشعارات بتوصل هنا",
    description:
      "أي حاجة جديدة — رد على تقييمك، أو صنايعي جديد في تخصصك — بتظهرلك هنا أول ما تدخل.",
    target: '[data-tour="notifications-bell"]',
    skipScroll: true,
    interaction: "click-target",
  },
  {
    id: "account-favorites",
    tour: "account",
    title: "مفضلتك معاك في كل مكان",
    description:
      "الصنايعية اللي حفظتها بقت متزامنة مع حسابك — جرب تحفظ صنايعي من أي جهاز وهتلاقيه موجود هنا.",
    target: '[data-tour="nav-favorites"]',
    optional: true,
    skipScroll: true,
    interaction: "click-target",
  },
  {
    id: "account-navigation",
    tour: "account",
    title: "حسابك فيه أكتر",
    description:
      "من حسابك هتلاقي سجل نشاطاتك، إعداداتك، ومفضلتك — ولو فني، لوحة التحكم دي بتبقى من هنا.",
    target: '[data-tour="nav-profile"]',
    skipScroll: true,
  },
];

export const TOURS: Record<TourId, TourStep[]> = {
  core: CORE_TOUR_STEPS,
  account: ACCOUNT_TOUR_STEPS,
};

/** فهرس أول خطوة تعتمد على صفحة تفاصيل الصنايعي (بعد خطوة الانتقال). */
export const DETAILS_STEPS_START_INDEX = CORE_TOUR_STEPS.findIndex(
  (step) => step.id === "open-details",
) + 1;

export function resolveStepTarget(step: TourStep, isMobile: boolean): string | null {
  if (typeof step.target === "function") return step.target(isMobile);
  return step.target ?? null;
}

export function stepDescription(step: TourStep, isMobile: boolean): string {
  return isMobile && step.mobileDescription ? step.mobileDescription : step.description;
}

/** هل صفحة المسار الحالية متوافقة مع خطوة (تُستخدم لرصد خروج المستخدم عن الجولة)؟ */
export function stepAllowsPathname(
  tour: TourId,
  stepIndex: number,
  pathname: string,
): boolean {
  if (tour === "account") return pathname === "/";
  return stepIndex >= DETAILS_STEPS_START_INDEX
    ? pathname.startsWith("/craftsman/")
    : pathname === "/";
}