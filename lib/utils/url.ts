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

export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}
