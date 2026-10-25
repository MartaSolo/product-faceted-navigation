import type { ProductQuery } from "#shared/schemas/product-query";
import type { ProductCategory } from "#shared/types/product";
import { productQuerySchema } from "#shared/schemas/product-query";
import { buildProductQuery } from "#shared/utils/product-query";

type ProductFilterUpdates = Partial<Omit<ProductQuery, "category" | "page">>;

const isSortCompatible = (
  sort: ProductQuery["sort"],
  category: ProductCategory | undefined,
) => {
  if (sort?.startsWith("capacity-")) {
    return category === "battery";
  }

  if (sort?.startsWith("power-")) {
    return category === "solar panel";
  }

  return true;
};

export const useProductFilters = () => {
  const route = useRoute();
  const appliedQuery = computed(() => productQuerySchema.parse(route.query));

  const navigateToQuery = (query: ProductQuery) =>
    navigateTo({
      path: "/products",
      query: buildProductQuery(query),
    });

  const updateFilters = (updates: ProductFilterUpdates) =>
    navigateToQuery({
      ...appliedQuery.value,
      ...updates,
      page: 1,
    });

  const setCategory = (category: ProductCategory | undefined) => {
    const currentQuery = appliedQuery.value;

    return navigateToQuery({
      ...currentQuery,
      category,
      manufacturer: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      minPower: undefined,
      maxPower: undefined,
      sort: isSortCompatible(currentQuery.sort, category)
        ? currentQuery.sort
        : undefined,
      page: 1,
    });
  };

  const setPage = (page: number) =>
    navigateToQuery({
      ...appliedQuery.value,
      page,
    });

  const clearAll = () =>
    navigateToQuery({
      page: 1,
    });

  return {
    appliedQuery,
    updateFilters,
    setCategory,
    setPage,
    clearAll,
  };
};
