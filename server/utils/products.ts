import { parse } from "csv-parse/sync";
import { z } from "zod";

import type { Product } from "#shared/types/product";

const PRODUCT_ASSET_KEY = "products.csv";

const capacityPattern = /(\d+(?:\.\d+)?)kWh\b/i;
const powerPattern = /(\d+)W\b/i;

const csvProductSchema = z
  .object({
    name: z.string().trim().min(1),
    manufacturer: z.string().trim().min(1),
    price: z
      .string()
      .trim()
      .regex(/^\d+(?:\.\d+)?$/)
      .transform(Number)
      .pipe(z.number().finite().nonnegative()),
    description: z.string().trim().min(1),
    category: z.enum(["battery", "solar panel", "connector"]),
  })
  .strict();

type CsvProduct = z.infer<typeof csvProductSchema>;

// Cache lives in this server instance's memory. The promise is also cached so
// concurrent requests share one CSV load instead of processing the file twice.
let cachedProducts: Product[] | undefined;
let loadingProducts: Promise<Product[]> | undefined;

const extractRequiredNumber = (
  description: string,
  pattern: RegExp,
  field: "capacityKwh" | "powerW",
  rowNumber: number,
) => {
  const value = description.match(pattern)?.[1];

  if (value === undefined) {
    throw new Error(`Missing ${field} in CSV row ${rowNumber}.`);
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Invalid ${field} in CSV row ${rowNumber}.`);
  }

  return parsedValue;
};

const normalizeProduct = (product: CsvProduct, index: number): Product => {
  const baseProduct = {
    id: String(index + 1),
    name: product.name,
    manufacturer: product.manufacturer,
    description: product.description,
    price: product.price,
  };
  const rowNumber = index + 2;

  switch (product.category) {
    case "battery":
      return {
        ...baseProduct,
        category: product.category,
        capacityKwh: extractRequiredNumber(
          product.description,
          capacityPattern,
          "capacityKwh",
          rowNumber,
        ),
        powerW: null,
      };
    case "solar panel":
      return {
        ...baseProduct,
        category: product.category,
        capacityKwh: null,
        powerW: extractRequiredNumber(
          product.description,
          powerPattern,
          "powerW",
          rowNumber,
        ),
      };
    case "connector":
      return {
        ...baseProduct,
        category: product.category,
        capacityKwh: null,
        powerW: null,
      };
  }
};

// Reads the private CSV asset, validates its records and normalizes them into
// the Product model used by the application.
const loadProducts = async (): Promise<Product[]> => {
  const csvContent =
    await useStorage("assets:products").getItem(PRODUCT_ASSET_KEY);
  const validatedCsvContent = z.string().min(1).parse(csvContent);
  const parsedRecords: unknown = parse(validatedCsvContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  });
  const products = z.array(csvProductSchema).parse(parsedRecords);

  return products.map(normalizeProduct);
};

// Returns cached products when available, otherwise loads them once. A failed
// load is not cached, allowing the next request to try again.
export const getProducts = async (): Promise<Product[]> => {
  if (cachedProducts !== undefined) {
    return cachedProducts;
  }

  if (loadingProducts !== undefined) {
    return loadingProducts;
  }

  const pendingProducts = loadProducts().then((products) => {
    cachedProducts = products;

    return products;
  });

  loadingProducts = pendingProducts;

  try {
    return await pendingProducts;
  } finally {
    if (loadingProducts === pendingProducts) {
      loadingProducts = undefined;
    }
  }
};
