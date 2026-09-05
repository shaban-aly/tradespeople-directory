export function categoryHref(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`;
}

export function craftsmanHref(slug: string): string {
  return `/craftsman/${encodeURIComponent(slug)}`;
}

export type SearchHrefParams = {
  q?: string;
  category?: string;
  area?: string;
  sort?: string;
};

export function searchHref(filters: SearchHrefParams = {}): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.area) params.set("area", filters.area);
  if (filters.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[\s()-]/g, "")}`;
}

// أرقام مصرية: 011/010/012/015 (11 رقم) أو 01X… بدون صفر (10 أرقام)
// أو رقم محلي بدون كود الدولة — نضيف +20 تلقائياً إلا لو موجود.
export function normalizeEgyptianNumber(digits: string): string {
  if (digits.startsWith("0020")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

export function craftsmanWhatsappMessage(
  name: string,
  categoryName?: string,
): string {
  const trade = categoryName && categoryName.trim() ? ` ${categoryName}` : "";
  return `السلام عليكم يا أسطى ${name}، شفت رقمك على دليل الصنايعية بالسويس ومحتاج مساعدة في شغل${trade}.`;
}

export function whatsappHref(number: string, message?: string): string {
  let digits = number.replace(/\D/g, "");
  digits = normalizeEgyptianNumber(digits);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}
