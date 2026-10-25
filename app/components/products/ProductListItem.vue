<script setup lang="ts">
import type { Product } from "#shared/types/product";

defineProps<{
  product: Product;
}>();

const categoryLabels: Record<Product["category"], string> = {
  battery: "Battery",
  "solar panel": "Solar panel",
  connector: "Connector",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
</script>

<template>
  <li class="py-6 first:pt-0 last:pb-0">
    <article class="space-y-3">
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="space-y-1">
          <p class="text-sm text-muted">
            {{ categoryLabels[product.category] }} · {{ product.manufacturer }}
          </p>
          <h2 class="text-lg font-semibold text-highlighted">
            {{ product.name }}
          </h2>
          <p
            v-if="product.category === 'battery'"
            class="text-base font-medium text-highlighted"
          >
            Capacity: {{ product.capacityKwh }} kWh
          </p>
          <p
            v-else-if="product.category === 'solar panel'"
            class="text-base font-medium text-highlighted"
          >
            Power: {{ product.powerW }} W
          </p>
        </div>
        <p class="shrink-0 font-semibold tabular-nums">
          {{ formatPrice(product.price) }}
        </p>
      </div>

      <UCollapsible class="space-y-1">
        <template #default="{ open }">
          <UButton
            color="neutral"
            variant="link"
            class="px-0"
            :trailing-icon="
              open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
            "
            :aria-expanded="open"
          >
            {{ open ? "Hide description" : "Show description" }}
          </UButton>
        </template>

        <template #content>
          <p class="max-w-3xl text-sm leading-6 text-muted">
            {{ product.description }}
          </p>
        </template>
      </UCollapsible>
    </article>
  </li>
</template>
