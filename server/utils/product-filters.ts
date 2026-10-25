import type { FilterRange, FiltersResponse } from "#shared/types/filters";
import type { Product, ProductCategory } from "#shared/types/product";
import {
  PRODUCT_CATEGORIES,
  productCategorySchema,
} from "#shared/schemas/product-query";

type RawQuery = Record<string, string | string[] | undefined>;

const parseFilterCategory = (rawQuery: RawQuery) => {
  const category = rawQuery.category;

  if (Array.isArray(category)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameter "category" cannot be repeated.',
    });
  }

  if (category === undefined) {
    return undefined;
  }

  const result = productCategorySchema.safeParse(category);

  if (!result.success) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product category not found.",
    });
  }

  return result.data;
};

const createRange = (values: number[]): FilterRange => ({
  min: Math.min(...values),
  max: Math.max(...values),
});

// Creates filter options and ranges from all products in the selected category,
// or from the complete catalog when no category is selected.
export const createFiltersResponse = (
  products: Product[],
  rawQuery: RawQuery,
): FiltersResponse => {
  const category = parseFilterCategory(rawQuery);

  const relevantProducts =
    category === undefined
      ? products
      : products.filter((product) => product.category === category);

  const manufacturers = [
    ...new Set(relevantProducts.map((product) => product.manufacturer)),
  ];

  const capacityKwh =
    category === "battery"
      ? createRange(
          relevantProducts.flatMap((product) =>
            product.capacityKwh === null ? [] : [product.capacityKwh],
          ),
        )
      : null;

  const powerW =
    category === "solar panel"
      ? createRange(
          relevantProducts.flatMap((product) =>
            product.powerW === null ? [] : [product.powerW],
          ),
        )
      : null;

  return {
    categories: [...PRODUCT_CATEGORIES] satisfies ProductCategory[],
    manufacturers,
    ranges: {
      price: createRange(relevantProducts.map((product) => product.price)),
      capacityKwh,
      powerW,
    },
  };
};
