import { SearchInput } from "@/components/admin/SearchInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { toArabicDigits } from "@/lib/utils/format";
import type { CategoryRow } from "@/lib/db/admin";
import type {
  LeadFacetCounts,
  LeadFilter,
} from "@/lib/db/admin-selectors";

const SORT_OPTIONS: { value: LeadFilter["sort"]; label: string }[] = [
  { value: "newest", label: "الأحدث أولاً" },
  { value: "oldest", label: "الأقدم أولاً" },
  { value: "expiring", label: "الأقرب للانتهاء" },
];

/**
 * شريط فلاتر عروض العملاء: بحث + تخصص + الرؤية (منيو دروب داون كما طُلب
 * بدل صف التبويبات) + الفرز — صف واحد عمودياً على الموبايل (تلك الـ selects
 * الأصلية لها حد أدنى للعرض لا يُدمج جنباً إلى جنب على الشاشات الضيقة)،
 * عمودان من md والشبكة الكاملة على الشاشات العريضة.
 */
export function LeadsFilters({
  filter,
  categories,
  facets,
  onChange,
}: {
  filter: LeadFilter;
  categories: CategoryRow[];
  facets: LeadFacetCounts;
  onChange: (next: Partial<LeadFilter>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_repeat(3,minmax(10rem,1fr))]">
      <SearchInput
        value={filter.search}
        onChange={(search) => onChange({ search })}
        placeholder="ابحث برقم الهاتف أو الوصف..."
      />
      <AdminSelect
        value={filter.category}
        onChange={(event) => onChange({ category: event.target.value })}
        aria-label="فلتر التخصص"
      >
        <option value="all">كل التخصصات</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </AdminSelect>
      <AdminSelect
        value={filter.visibility}
        onChange={(event) =>
          onChange({
            visibility: event.target.value as LeadFilter["visibility"],
          })
        }
        aria-label="فلتر الظهور"
      >
        <option value="all">
          الكل ({toArabicDigits(facets.visibilityAll)})
        </option>
        <option value="visible">
          مرئي فقط ({toArabicDigits(facets.visible)})
        </option>
        <option value="hidden">
          مخفي فقط ({toArabicDigits(facets.hidden)})
        </option>
      </AdminSelect>
      <AdminSelect
        value={filter.sort}
        onChange={(event) =>
          onChange({ sort: event.target.value as LeadFilter["sort"] })
        }
        aria-label="ترتيب النتائج"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AdminSelect>
    </div>
  );
}
