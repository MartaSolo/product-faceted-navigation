<script setup lang="ts">
import type { NuxtError } from "#app";
import type { ProductsResponse } from "#shared/types/api";
import type { FiltersResponse } from "#shared/types/filters";
import { buildProductQuery } from "#shared/utils/product-query";

definePageMeta({
  middleware: "products",
});

const { appliedQuery, clearAll } = useProductFilters();

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
            Showing {{ products?.meta.total ?? 0 }} products across
            {{ filters?.categories.length ?? 0 }} categories.
          </p>
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

        <ul v-else class="divide-y divide-default" aria-label="Product list">
          <li
            v-for="product in products?.data"
            :key="product.id"
            class="space-y-1 py-4"
          >
            <h2 class="font-medium">{{ product.name }}</h2>
            <p class="text-sm text-muted">
              {{ product.category }} · {{ product.manufacturer }} ·
              {{ product.price }}
            </p>
          </li>
        </ul>
      </div>
    </UContainer>
  </main>
</template>
