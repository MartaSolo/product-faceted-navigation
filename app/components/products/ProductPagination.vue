<script setup lang="ts">
import type { ProductsResponse } from "#shared/types/api";
import type { ProductQuery } from "#shared/schemas/product-query";
import { buildProductQuery } from "#shared/utils/product-query";

const props = defineProps<{
  meta: ProductsResponse["meta"];
  query: ProductQuery;
}>();

type PaginationItem =
  | { type: "page"; page: number; key: string }
  | { type: "ellipsis"; key: string };

const pageItem = (page: number): PaginationItem => ({
  type: "page",
  page,
  key: `page-${page}`,
});

const paginationItems = computed<PaginationItem[]>(() => {
  const { page, totalPages } = props.meta;

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) =>
      pageItem(index + 1),
    );
  }

  if (page <= 4) {
    return [
      ...[1, 2, 3, 4, 5].map(pageItem),
      { type: "ellipsis", key: "ellipsis-end" },
      pageItem(totalPages),
    ];
  }

  if (page >= totalPages - 3) {
    return [
      pageItem(1),
      { type: "ellipsis", key: "ellipsis-start" },
      ...Array.from({ length: 5 }, (_, index) =>
        pageItem(totalPages - 4 + index),
      ),
    ];
  }

  return [
    pageItem(1),
    { type: "ellipsis", key: "ellipsis-start" },
    pageItem(page - 1),
    pageItem(page),
    pageItem(page + 1),
    { type: "ellipsis", key: "ellipsis-end" },
    pageItem(totalPages),
  ];
});

const pageLocation = (page: number) => ({
  path: "/products",
  query: buildProductQuery({
    ...props.query,
    page,
  }),
});
</script>

<template>
  <nav
    v-if="meta.totalPages > 1"
    class="flex flex-wrap items-center justify-center gap-2"
    aria-label="Product pagination"
  >
    <UButton
      v-if="meta.page > 1"
      :to="pageLocation(meta.page - 1)"
      color="neutral"
      variant="outline"
      icon="i-lucide-chevron-left"
      aria-label="Previous page"
    />

    <template v-for="item in paginationItems" :key="item.key">
      <NuxtLink
        v-if="item.type === 'page'"
        :to="pageLocation(item.page)"
        class="flex size-9 items-center justify-center rounded-md text-sm font-medium ring ring-default transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="
          item.page === meta.page
            ? 'bg-primary text-inverted ring-primary'
            : 'bg-default text-highlighted'
        "
        :aria-current="item.page === meta.page ? 'page' : undefined"
        :aria-label="`Page ${item.page}`"
      >
        {{ item.page }}
      </NuxtLink>
      <span
        v-else
        class="flex size-9 items-center justify-center text-sm text-muted"
        aria-hidden="true"
      >
        …
      </span>
    </template>

    <UButton
      v-if="meta.page < meta.totalPages"
      :to="pageLocation(meta.page + 1)"
      color="neutral"
      variant="outline"
      icon="i-lucide-chevron-right"
      aria-label="Next page"
    />
  </nav>
</template>
