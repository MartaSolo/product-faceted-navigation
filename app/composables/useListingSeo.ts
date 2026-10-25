import type { Ref } from "vue";
import type { ProductQuery } from "#shared/schemas/product-query";
import type { ProductCategory } from "#shared/types/product";

const listingTitles: Record<ProductCategory, string> = {
  battery: "Batteries",
  "solar panel": "Solar Panels",
  connector: "Connectors",
};

const listingDescriptions: Record<ProductCategory, string> = {
  battery: "Browse and compare batteries from leading manufacturers.",
  "solar panel": "Browse and compare solar panels from leading manufacturers.",
  connector: "Browse and compare connectors from leading manufacturers.",
};

const allProductsDescription =
  "Browse and compare batteries, solar panels and connectors from leading manufacturers.";

export const useListingSeo = (query: Ref<ProductQuery>) => {
  const title = computed(() => {
    const { category, page } = query.value;
    const listingTitle = category ? listingTitles[category] : "Products";
    const pageSuffix = page > 1 ? ` – Page ${page}` : "";

    return `${listingTitle}${pageSuffix} | Sun.store`;
  });

  const description = computed(() => {
    const { category } = query.value;

    return category ? listingDescriptions[category] : allProductsDescription;
  });

  useSeoMeta({
    title,
    description,
  });
};
