import type { ProductCategory } from "./product";

export interface FilterRange {
  min: number;
  max: number;
}

export interface FiltersResponse {
  categories: ProductCategory[];
  manufacturers: string[];
  ranges: {
    price: FilterRange;
    capacityKwh: FilterRange | null;
    powerW: FilterRange | null;
  };
}
