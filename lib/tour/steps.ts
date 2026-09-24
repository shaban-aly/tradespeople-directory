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
    title: "أهلاً بيك في دليل الصنايعية 👋",
    description:
      "هنا هتلاقي صنايعية من مختلف التخصصات في السويس. الجولة دي هتعرّفك بسرعة إزاي تدور، تختار، وتتواصل مع الصنايعي المناسب.",
  },

  {
    id: "hero-search",
    tour: "core",
    title: "دَوّر على اللي محتاجه",
    description:
      "اكتب اسم المهنة أو الخدمة اللي محتاجها، زي «سباك» أو «كهربائي»، وهتظهرلك النتائج المناسبة.",
    target: '[data-tour="hero-search"]',
    interaction: "click-target",
  },

  {
    id: "hero-search-tags",
    tour: "core",
    title: "مش عارف تكتب إيه؟",
    description:
      "اختار أي تخصص من الاختيارات الجاهزة، وهندخلك على النتائج مباشرة.",
    target: '[data-tour="hero-search-tags"]',
  },

  {
    id: "home-categories",
    tour: "core",
    title: "كل التخصصات قدامك",
    description:
      "التخصصات متقسمة بشكل واضح عشان تلاقي اللي محتاجه بسهولة. اختار التخصص وابدأ التصفح.",
    target: '[data-tour="home-categories"]',
  },

  {
    id: "craftsman-card",
    tour: "core",
    title: "اتعرّف على الصنايعي",
    description:
      "كل صنايعي ليه كارت يوضح اسمه، تخصصه، منطقته وتقييماته. اضغط على الكارت عشان تشوف التفاصيل.",
    target: '[data-tour="craftsman-card-link"]',
    interaction: "manual",
  },

  {
    id: "card-contact",
    tour: "core",
    title: "اتصل بيه مباشرة",
    description:
      "لما تلاقي الصنايعي المناسب، اضغط اتصال عشان تكلمه مباشرة.",
    target: '[data-tour="card-call"]',
    interaction: "click-target",
  },

  {
    id: "card-whatsapp",
    tour: "core",
    title: "أو ابعتله على واتساب",
    description:
      "لو تفضل المراسلة، افتح واتساب وتواصل مع الصنايعي مباشرة.",
    target: '[data-tour="card-whatsapp"]',
    interaction: "click-target",
    optional: true,
  },

  {
    id: "card-favorite",
    tour: "core",
    title: "احفظه عندك",
    description:
      "اضغط على علامة النجمة عشان تضيف الصنايعي لمفضلتك وترجعله بسهولة بعدين.",
    target: '[data-tour="card-favorite"]',
    interaction: "click-target",
  },

  {
    id: "trust-strip",
    tour: "core",
    title: "معلومة مهمة",
    description:
      "دليل الصنايعية خدمة مجانية، وبيتم مراجعة بيانات وأرقام الصنايعية قبل نشرها.",
    target: '[data-tour="trust-strip"]',
  },

  {
    id: "navigation",
    tour: "core",
    title: "كل حاجة قريبة منك",
    description:
      "من هنا تقدر تتنقل بسهولة بين الرئيسية، التصنيفات، المفضلة وحسابك.",
    mobileDescription:
      "الشريط ده هيساعدك تتنقل بين الرئيسية، التصنيفات، البحث، المفضلة وحسابك.",
    target: (isMobile) =>
      isMobile ? '[data-tour="bottom-nav"]' : '[data-tour="header-nav"]',
    skipScroll: true,
  },

  {
    id: "open-details",
    tour: "core",
    title: "تعالى نشوف التفاصيل",
    description:
      "دلوقتي هنفتح صفحة صنايعي عشان نشوف البيانات والتقييمات وطرق التواصل.",
    transition: true,
  },

  {
    id: "details-header",
    tour: "core",
    title: "كل بيانات الصنايعي هنا",
    description:
      "هنا هتلاقي اسمه، صورته، تخصصه، منطقته، وحالة التوثيق لو كان موثّق.",
    target: '[data-tour="details-header"]',
  },

  {
    id: "details-contact",
    tour: "core",
    title: "تواصل معاه بسهولة",
    description:
      "اضغط اتصال عشان تكلمه مباشرة. وعلى الموبايل هتلاقي زر الاتصال ثابت قدامك أثناء التصفح.",
    target: (isMobile) =>
      isMobile ? '[data-tour="sticky-call-call"]' : '[data-tour="details-call"]',
    skipScroll: false,
    interaction: "click-target",
  },

  {
    id: "details-whatsapp",
    tour: "core",
    title: "واتساب كمان متاح",
    description:
      "تقدر تبعتله رسالة على واتساب مباشرة لو المراسلة أنسب ليك.",
    target: (isMobile) =>
      isMobile
        ? '[data-tour="sticky-call-whatsapp"]'
        : '[data-tour="details-whatsapp"]',
    skipScroll: false,
    interaction: "click-target",
    optional: true,
  },

  {
    id: "details-reviews",
    tour: "core",
    title: "شوف تقييمات الناس",
    description:
      "اقرأ تجارب وتقييمات العملاء قبل ما تتواصل مع الصنايعي. ولو جربته، شارك تجربتك وساعد غيرك.",
    target: '[data-tour="details-reviews"]',
  },
];

export const ACCOUNT_TOUR_STEPS: TourStep[] = [
  {
    id: "account-bell",
    tour: "account",
    title: "هنا هتلاقي إشعاراتك",
    description:
      "أي تحديث يخص حسابك، زي الردود أو النشاطات الجديدة، هتلاقيه هنا.",
    target: '[data-tour="notifications-bell"]',
    skipScroll: true,
    interaction: "click-target",
  },

  {
    id: "account-favorites",
    tour: "account",
    title: "مفضلتك محفوظة",
    description:
      "الصنايعية اللي حفظتهم هتلاقيهم هنا، وتقدر ترجع لهم في أي وقت.",
    target: '[data-tour="nav-favorites"]',
    optional: true,
    skipScroll: true,
    interaction: "click-target",
  },

  {
    id: "account-navigation",
    tour: "account",
    title: "حسابك فيه كل اللي يخصك",
    description:
      "من هنا تقدر تراجع نشاطك، تدير إعداداتك ومفضلتك، ولو أنت صنايعي هتلاقي لوحة التحكم الخاصة بيك.",
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