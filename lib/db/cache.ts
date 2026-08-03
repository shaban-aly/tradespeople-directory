export const SEARCH_CACHE_REVALIDATE = 60;
export const SEARCH_TAG = "search";

export const SEARCH_CACHE_KEYS = {
  data: "search-data",
  craftsmen: "search-craftsmen",
} as const;

export const DATA_CACHE_KEYS = {
  categories: "data-categories",
  craftsmen: "data-craftsmen",
  areas: "data-areas",
} as const;
