import {
  PRODUCT_QUERY_KEYS,
  productCategorySchema,
  productQuerySchema,
  type ProductQuery,
  type ProductQueryKey,
} from "../schemas/product-query";

export type RawProductQuery = Record<
  string,
  string | null | undefined | (string | null)[]
>;

export type ProductQueryParseResult =
  | { success: true; data: ProductQuery }
  | {
      success: false;
      reason: "duplicate";
      key: ProductQueryKey;
    }
  | {
      success: false;
      reason: "unknown-category" | "invalid-query";
    };

export type BuiltProductQuery = Partial<Record<ProductQueryKey, string>>;

const buildManufacturerValue = (manufacturers: string[]) =>
  [...new Set(manufacturers)]
    .sort((first, second) => first.localeCompare(second, "en"))
    .join(",");

// Parses raw router or API query values without depending on Nuxt or H3 error
// types. Callers map the failure reason to the appropriate HTTP error.
export const parseProductQuery = (
  rawQuery: RawProductQuery,
): ProductQueryParseResult => {
  const queryInput: Record<string, string | undefined> = {};

  for (const key of PRODUCT_QUERY_KEYS) {
    const value = rawQuery[key];

    if (Array.isArray(value)) {
      return {
        success: false,
        reason: "duplicate",
        key,
      };
    }

    queryInput[key] = value ?? undefined;
  }

  const categoryResult = productCategorySchema.safeParse(queryInput.category);

  if (queryInput.category !== undefined && !categoryResult.success) {
    return {
      success: false,
      reason: "unknown-category",
    };
  }

  const queryResult = productQuerySchema.safeParse(queryInput);

  if (!queryResult.success) {
    return {
      success: false,
      reason: "invalid-query",
    };
  }

  return {
    success: true,
    data: queryResult.data,
  };
};

// Serializes an already validated product query into its canonical URL form.
// Property assignment order matches the order required for product URLs.
export const buildProductQuery = (
  productQuery: ProductQuery,
): BuiltProductQuery => {
  const query: BuiltProductQuery = {};

  if (productQuery.category !== undefined) {
    query.category = productQuery.category;
  }

  const searchPhrase = productQuery.q?.trim();

  if (searchPhrase) {
    query.q = searchPhrase;
  }

  if (productQuery.manufacturer !== undefined) {
    const manufacturers = buildManufacturerValue(productQuery.manufacturer);

    if (manufacturers !== "") {
      query.manufacturer = manufacturers;
    }
  }

  if (productQuery.minPrice !== undefined) {
    query.minPrice = String(productQuery.minPrice);
  }

  if (productQuery.maxPrice !== undefined) {
    query.maxPrice = String(productQuery.maxPrice);
  }

  if (productQuery.minCapacity !== undefined) {
    query.minCapacity = String(productQuery.minCapacity);
  }

  if (productQuery.maxCapacity !== undefined) {
    query.maxCapacity = String(productQuery.maxCapacity);
  }

  if (productQuery.minPower !== undefined) {
    query.minPower = String(productQuery.minPower);
  }

  if (productQuery.maxPower !== undefined) {
    query.maxPower = String(productQuery.maxPower);
  }

  if (productQuery.sort !== undefined) {
    query.sort = productQuery.sort;
  }

  if (productQuery.page !== 1) {
    query.page = String(productQuery.page);
  }

  return query;
};
