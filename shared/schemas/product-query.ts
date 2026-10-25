import { z } from "zod";

export const PRODUCT_QUERY_KEYS = [
  "category",
  "q",
  "manufacturer",
  "minPrice",
  "maxPrice",
  "minCapacity",
  "maxCapacity",
  "minPower",
  "maxPower",
  "sort",
  "page",
] as const;

export const PRODUCT_SORT_OPTIONS = [
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
  "capacity-asc",
  "capacity-desc",
  "power-asc",
  "power-desc",
] as const;

export const productCategorySchema = z.enum([
  "battery",
  "solar panel",
  "connector",
]);

export const productSortSchema = z.enum(PRODUCT_SORT_OPTIONS);

const rangeValueSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?$/)
  .transform(Number)
  .pipe(z.number().finite().nonnegative());

const pageSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

// Converts raw URL query strings into typed filter values and validates
// cross-field rules such as range order and category-specific filters/sorts.
export const productQuerySchema = z
  .object({
    category: productCategorySchema.optional(),
    q: z.string().trim().optional(),
    manufacturer: z
      .string()
      .trim()
      .min(1)
      .transform((value) => value.split(",").map((item) => item.trim()))
      .pipe(z.array(z.string().min(1)))
      .transform((values) => [...new Set(values)])
      .optional(),
    minPrice: rangeValueSchema.optional(),
    maxPrice: rangeValueSchema.optional(),
    minCapacity: rangeValueSchema.optional(),
    maxCapacity: rangeValueSchema.optional(),
    minPower: rangeValueSchema.optional(),
    maxPower: rangeValueSchema.optional(),
    sort: productSortSchema.optional(),
    page: pageSchema.default(1),
  })
  .superRefine((query, context) => {
    const ranges = [
      [query.minPrice, query.maxPrice, "price"],
      [query.minCapacity, query.maxCapacity, "capacity"],
      [query.minPower, query.maxPower, "power"],
    ] as const;

    for (const [minimum, maximum, name] of ranges) {
      if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
        context.addIssue({
          code: "custom",
          message: `Minimum ${name} cannot exceed maximum ${name}.`,
        });
      }
    }

    const hasCapacityFilter =
      query.minCapacity !== undefined || query.maxCapacity !== undefined;
    const hasPowerFilter =
      query.minPower !== undefined || query.maxPower !== undefined;
    const hasCapacitySort = query.sort?.startsWith("capacity-") ?? false;
    const hasPowerSort = query.sort?.startsWith("power-") ?? false;

    if (
      (hasCapacityFilter || hasCapacitySort) &&
      query.category !== "battery"
    ) {
      context.addIssue({
        code: "custom",
        message: "Capacity filtering and sorting require the battery category.",
      });
    }

    if ((hasPowerFilter || hasPowerSort) && query.category !== "solar panel") {
      context.addIssue({
        code: "custom",
        message:
          "Power filtering and sorting require the solar panel category.",
      });
    }
  });

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductQueryKey = (typeof PRODUCT_QUERY_KEYS)[number];
export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];
