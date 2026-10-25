<script setup lang="ts">
import type { NuxtError } from "#app";
import ProductFilters from "~/components/products/ProductFilters.vue";
import ProductListItem from "~/components/products/ProductListItem.vue";
import ProductPagination from "~/components/products/ProductPagination.vue";
import type { ProductsResponse } from "#shared/types/api";
import type { FiltersResponse } from "#shared/types/filters";
import { productSortSchema } from "#shared/schemas/product-query";
import { buildProductQuery } from "#shared/utils/product-query";

definePageMeta({
  middleware: "products",
});

const { appliedQuery, updateFilters, clearAll } = useProductFilters();

useListingSeo(appliedQuery);

const searchQuery = ref("");

watch(
  () => appliedQuery.value.q,
  (query) => {
    searchQuery.value = query ?? "";
  },
  { immediate: true },
);

const submitSearch = () =>
  updateFilters({ q: searchQuery.value.trim() || undefined });

const commonSortItems = [
  { label: "Default", value: "default" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
];

const sortItems = computed(() => {
  if (appliedQuery.value.category === "battery") {
    return [
      ...commonSortItems,
      { label: "Capacity: low to high", value: "capacity-asc" },
      { label: "Capacity: high to low", value: "capacity-desc" },
    ];
  }

  if (appliedQuery.value.category === "solar panel") {
    return [
      ...commonSortItems,
      { label: "Power: low to high", value: "power-asc" },
      { label: "Power: high to low", value: "power-desc" },
    ];
  }

  return commonSortItems;
});

const selectedSort = computed(() => appliedQuery.value.sort ?? "default");

const changeSort = (value: unknown) => {
  if (value === "default") {
    return updateFilters({ sort: undefined });
  }

  const sort = productSortSchema.safeParse(value);

  if (sort.success) {
    return updateFilters({ sort: sort.data });
  }
};

const productsApiQuery = computed(() => buildProductQuery(appliedQuery.value));
const selectedCategory = computed(() => appliedQuery.value.category);

const [
  { data: products, status: productsStatus, error: productsError },
  { data: filters, status: filtersStatus, error: filtersError },
] = await Promise.all([
  useFetch<ProductsResponse>("/api/products", {
    key: "product-listing",
    query: productsApiQuery,
  }),
  useFetch<FiltersResponse>("/api/filters", {
    key: "product-filters",
    query: {
      category: selectedCategory,
    },
  }),
]);

const handleRequestError = (error: NuxtError | null | undefined) => {
  if (error === null || error === undefined) return;

  const listingError = createError({
    statusCode: error.statusCode,
    statusMessage: error.statusMessage,
  });

  // useFetch stores API failures in an error ref instead of throwing them.
  // Throw during SSR so the page response preserves the API's HTTP status.
  if (import.meta.server) {
    throw listingError;
  }

  // Reactive refetches happen after setup on client-side navigation, so they
  // must be forwarded to Nuxt's error boundary explicitly.
  showError(listingError);
};

// Handle failures from the initial parallel requests, including SSR requests.
handleRequestError(productsError.value ?? filtersError.value);

// The initial check does not run again when reactive query options refetch.
// Watch both error refs to handle failures from later client-side navigation.
watch([productsError, filtersError], ([productError, filterError]) => {
  handleRequestError(productError ?? filterError);
});

const isLoading = computed(
  () => productsStatus.value === "pending" || filtersStatus.value === "pending",
);
</script>

<template>
  <main>
    <UContainer class="py-12 sm:py-16">
      <div class="space-y-8">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
            Products
          </h1>
          <p class="max-w-2xl text-muted">
            {{ products?.meta.total ?? 0 }} products found.
          </p>
        </div>

        <div
          class="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start"
        >
          <aside
            v-if="filters"
            class="hidden rounded-lg border border-default p-5 lg:sticky lg:top-6 lg:block"
          >
            <ProductFilters :filters="filters" />
          </aside>

          <section class="min-w-0 space-y-6" aria-label="Products">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
              <form
                class="flex min-w-0 flex-1 gap-2"
                @submit.prevent="submitSearch"
              >
                <label for="product-search" class="sr-only">
                  Search products
                </label>
                <UInput
                  id="product-search"
                  v-model="searchQuery"
                  type="search"
                  placeholder="Search products"
                  icon="i-lucide-search"
                  class="min-w-0 flex-1"
                />
                <UButton type="submit">Search</UButton>
              </form>

              <div class="flex items-end gap-2">
                <UDrawer
                  v-if="filters"
                  title="Filters"
                  description="Filter the product list"
                  direction="left"
                  close
                >
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-list-filter"
                    class="lg:hidden"
                  >
                    Filters
                  </UButton>

                  <template #body>
                    <ProductFilters :filters="filters" />
                  </template>
                </UDrawer>

                <div class="min-w-48 flex-1 sm:flex-none">
                  <label
                    for="product-sort"
                    class="mb-1 block text-sm font-medium"
                  >
                    Sort by
                  </label>
                  <USelect
                    id="product-sort"
                    :model-value="selectedSort"
                    :items="sortItems"
                    value-key="value"
                    class="w-full"
                    @update:model-value="changeSort"
                  />
                </div>
              </div>
            </div>

            <p v-if="isLoading" role="status" class="text-sm text-muted">
              Loading products…
            </p>

            <div
              v-if="products?.data.length === 0"
              class="space-y-3 rounded-lg border border-default p-6"
            >
              <p>No products match the current filters.</p>
              <UButton color="neutral" variant="outline" @click="clearAll">
                Clear all filters
              </UButton>
            </div>

            <ul
              v-else
              class="divide-y divide-default"
              aria-label="Product list"
              :aria-busy="isLoading"
            >
              <ProductListItem
                v-for="product in products?.data"
                :key="product.id"
                :product="product"
              />
            </ul>

            <ProductPagination
              v-if="products"
              :meta="products.meta"
              :query="appliedQuery"
            />
          </section>
        </div>
      </div>
    </UContainer>
  </main>
</template>
