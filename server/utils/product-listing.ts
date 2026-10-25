import type { ProductsResponse } from "#shared/types/api";
import type { Product } from "#shared/types/product";
import type { ProductQuery } from "#shared/schemas/product-query";
import type { RawProductQuery } from "#shared/utils/product-query";
import { parseProductQuery } from "#shared/utils/product-query";

const PAGE_SIZE = 12;

interface IndexedProduct {
  product: Product;
  originalIndex: number;
}

// Parses and validates the raw query parameters received by the products API.
// It rejects repeated single-value parameters, returns 404 for an unknown
// category, converts valid URL strings into typed filter values, and checks
// that requested manufacturers exist in the selected category. Unknown query
// keys are ignored. The returned query is safe to use for filtering, sorting
// and pagination.
const parseValidatedProductQuery = (
  rawQuery: RawProductQuery,
  products: Product[],
) => {
  const queryResult = parseProductQuery(rawQuery);

  if (!queryResult.success) {
    if (queryResult.reason === "duplicate") {
      throw createError({
        statusCode: 400,
        statusMessage: `Query parameter "${queryResult.key}" cannot be repeated.`,
      });
    }

    if (queryResult.reason === "unknown-category") {
      throw createError({
        statusCode: 404,
        statusMessage: "Product category not found.",
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid product query.",
    });
  }

  const query = queryResult.data;

  if (query.manufacturer !== undefined) {
    const availableManufacturers = new Set(
      products
        .filter(
          (product) =>
            query.category === undefined || product.category === query.category,
        )
        .map((product) => product.manufacturer),
    );

    const hasUnknownManufacturer = query.manufacturer.some(
      (manufacturer) => !availableManufacturers.has(manufacturer),
    );

    if (hasUnknownManufacturer) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid manufacturer.",
      });
    }
  }

  return query;
};

// Checks whether one product matches all active search and filter criteria.
// Different filter groups use AND logic, while selected manufacturers use OR
// logic. Numeric range boundaries are inclusive, and products without a
// relevant technical value do not match that technical filter.
const matchesQuery = (product: Product, query: ProductQuery) => {
  if (query.category !== undefined && product.category !== query.category) {
    return false;
  }

  if (query.q !== undefined && query.q !== "") {
    const phrase = query.q.toLocaleLowerCase("en");
    const searchableText = [
      product.name,
      product.manufacturer,
      product.description,
    ];

    if (
      !searchableText.some((value) =>
        value.toLocaleLowerCase("en").includes(phrase),
      )
    ) {
      return false;
    }
  }

  if (
    query.manufacturer !== undefined &&
    !query.manufacturer.includes(product.manufacturer)
  ) {
    return false;
  }

  if (query.minPrice !== undefined && product.price < query.minPrice) {
    return false;
  }

  if (query.maxPrice !== undefined && product.price > query.maxPrice) {
    return false;
  }

  if (query.minCapacity !== undefined) {
    if (
      product.capacityKwh === null ||
      product.capacityKwh < query.minCapacity
    ) {
      return false;
    }
  }

  if (query.maxCapacity !== undefined) {
    if (
      product.capacityKwh === null ||
      product.capacityKwh > query.maxCapacity
    ) {
      return false;
    }
  }

  if (query.minPower !== undefined) {
    if (product.powerW === null || product.powerW < query.minPower) {
      return false;
    }
  }

  if (query.maxPower !== undefined) {
    if (product.powerW === null || product.powerW > query.maxPower) {
      return false;
    }
  }

  return true;
};

// Compares two products for the selected sort option. When their values are
// equal, their original CSV position (`originalIndex`) is used as a tie-breaker
// to keep sorting deterministic.
const compareProducts = (
  first: IndexedProduct,
  second: IndexedProduct,
  sort: ProductQuery["sort"],
) => {
  let comparison = 0;

  switch (sort) {
    case "price-asc":
      comparison = first.product.price - second.product.price;
      break;
    case "price-desc":
      comparison = second.product.price - first.product.price;
      break;
    case "name-asc":
      comparison = first.product.name.localeCompare(second.product.name, "en");
      break;
    case "name-desc":
      comparison = second.product.name.localeCompare(first.product.name, "en");
      break;
    case "capacity-asc":
      comparison =
        (first.product.capacityKwh ?? 0) - (second.product.capacityKwh ?? 0);
      break;
    case "capacity-desc":
      comparison =
        (second.product.capacityKwh ?? 0) - (first.product.capacityKwh ?? 0);
      break;
    case "power-asc":
      comparison = (first.product.powerW ?? 0) - (second.product.powerW ?? 0);
      break;
    case "power-desc":
      comparison = (second.product.powerW ?? 0) - (first.product.powerW ?? 0);
      break;
  }

  return comparison || first.originalIndex - second.originalIndex;
};

// Builds the products API response by validating the query, filtering and
// sorting matching products, then applying pagination and creating metadata.
export const createProductsResponse = (
  products: Product[],
  rawQuery: RawProductQuery,
): ProductsResponse => {
  const query = parseValidatedProductQuery(rawQuery, products);

  const matchingProducts = products
    .map((product, originalIndex) => ({ product, originalIndex }))
    .filter(({ product }) => matchesQuery(product, query));

  if (query.sort !== undefined) {
    matchingProducts.sort((first, second) =>
      compareProducts(first, second, query.sort),
    );
  }

  const total = matchingProducts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (query.page > Math.max(totalPages, 1)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product page not found.",
    });
  }

  const pageStart = (query.page - 1) * PAGE_SIZE;

  const data = matchingProducts
    .slice(pageStart, pageStart + PAGE_SIZE)
    .map(({ product }) => product);

  return {
    data,
    meta: {
      page: query.page,
      limit: PAGE_SIZE,
      total,
      totalPages,
    },
  };
};
