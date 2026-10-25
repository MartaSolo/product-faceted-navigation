<script setup lang="ts">
import type { FilterRange, FiltersResponse } from "#shared/types/filters";
import { productCategorySchema } from "#shared/schemas/product-query";

const props = defineProps<{
  filters: FiltersResponse;
}>();

const { appliedQuery, setCategory, updateFilters, clearAll } =
  useProductFilters();
const categoryId = useId();
const rangeErrorId = useId();

const categoryItems = [
  { label: "All categories", value: "all" },
  { label: "Batteries", value: "battery" },
  { label: "Solar panels", value: "solar panel" },
  { label: "Connectors", value: "connector" },
];

const selectedCategory = computed(() => appliedQuery.value.category ?? "all");

const activeFiltersCount = computed(() => {
  const query = appliedQuery.value;
  let count = 0;

  if (query.category !== undefined) count += 1;
  if (query.manufacturer?.length) count += 1;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) count += 1;
  if (query.minCapacity !== undefined || query.maxCapacity !== undefined) {
    count += 1;
  }
  if (query.minPower !== undefined || query.maxPower !== undefined) count += 1;

  return count;
});

const rangeValues = reactive({
  minPrice: "",
  maxPrice: "",
  minCapacity: "",
  maxCapacity: "",
  minPower: "",
  maxPower: "",
});
const rangeError = ref<string>();

watch(rangeValues, () => {
  rangeError.value = undefined;
});

const toInputValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

watch(
  appliedQuery,
  (query) => {
    rangeError.value = undefined;
    rangeValues.minPrice = toInputValue(query.minPrice);
    rangeValues.maxPrice = toInputValue(query.maxPrice);
    rangeValues.minCapacity = toInputValue(query.minCapacity);
    rangeValues.maxCapacity = toInputValue(query.maxCapacity);
    rangeValues.minPower = toInputValue(query.minPower);
    rangeValues.maxPower = toInputValue(query.maxPower);
  },
  { immediate: true },
);

const parseRangeValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return value.trim() === "" ? undefined : Number(value);
  }

  return undefined;
};

const validateRange = (
  minimum: number | undefined,
  maximum: number | undefined,
  availableRange: FilterRange,
  label: string,
) => {
  if (
    minimum !== undefined &&
    (!Number.isFinite(minimum) ||
      minimum < availableRange.min ||
      minimum > availableRange.max)
  ) {
    return `Minimum ${label} must be between ${availableRange.min} and ${availableRange.max}.`;
  }

  if (
    maximum !== undefined &&
    (!Number.isFinite(maximum) ||
      maximum < availableRange.min ||
      maximum > availableRange.max)
  ) {
    return `Maximum ${label} must be between ${availableRange.min} and ${availableRange.max}.`;
  }

  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    return `Minimum ${label} cannot exceed maximum ${label}.`;
  }
};

const applyRanges = () => {
  const ranges = {
    minPrice: parseRangeValue(rangeValues.minPrice),
    maxPrice: parseRangeValue(rangeValues.maxPrice),
    minCapacity: parseRangeValue(rangeValues.minCapacity),
    maxCapacity: parseRangeValue(rangeValues.maxCapacity),
    minPower: parseRangeValue(rangeValues.minPower),
    maxPower: parseRangeValue(rangeValues.maxPower),
  };

  rangeError.value = validateRange(
    ranges.minPrice,
    ranges.maxPrice,
    props.filters.ranges.price,
    "price",
  );

  if (
    rangeError.value === undefined &&
    appliedQuery.value.category === "battery" &&
    props.filters.ranges.capacityKwh
  ) {
    rangeError.value = validateRange(
      ranges.minCapacity,
      ranges.maxCapacity,
      props.filters.ranges.capacityKwh,
      "capacity",
    );
  }

  if (
    rangeError.value === undefined &&
    appliedQuery.value.category === "solar panel" &&
    props.filters.ranges.powerW
  ) {
    rangeError.value = validateRange(
      ranges.minPower,
      ranges.maxPower,
      props.filters.ranges.powerW,
      "power",
    );
  }

  if (rangeError.value !== undefined) return;

  return updateFilters({
    minPrice: ranges.minPrice,
    maxPrice: ranges.maxPrice,
    minCapacity:
      appliedQuery.value.category === "battery"
        ? ranges.minCapacity
        : undefined,
    maxCapacity:
      appliedQuery.value.category === "battery"
        ? ranges.maxCapacity
        : undefined,
    minPower:
      appliedQuery.value.category === "solar panel"
        ? ranges.minPower
        : undefined,
    maxPower:
      appliedQuery.value.category === "solar panel"
        ? ranges.maxPower
        : undefined,
  });
};

const changeCategory = (value: string) => {
  if (value === "all") {
    return setCategory(undefined);
  }

  const category = productCategorySchema.safeParse(value);

  if (category.success) {
    return setCategory(category.data);
  }
};

const isManufacturerSelected = (manufacturer: string) =>
  appliedQuery.value.manufacturer?.includes(manufacturer) ?? false;

const toggleManufacturer = (manufacturer: string, selected: boolean) => {
  const manufacturers = new Set(appliedQuery.value.manufacturer ?? []);

  if (selected) {
    manufacturers.add(manufacturer);
  } else {
    manufacturers.delete(manufacturer);
  }

  return updateFilters({
    manufacturer: manufacturers.size === 0 ? undefined : [...manufacturers],
  });
};
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold">Filters</h2>
        <UBadge color="neutral" variant="soft">
          Active: {{ activeFiltersCount }}
        </UBadge>
      </div>
      <UButton color="neutral" variant="link" class="px-0" @click="clearAll">
        Clear all
      </UButton>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium" :for="categoryId">Category</label>
      <USelect
        :id="categoryId"
        :model-value="selectedCategory"
        :items="categoryItems"
        value-key="value"
        class="w-full"
        @update:model-value="changeCategory"
      />
    </div>

    <fieldset class="space-y-3">
      <legend class="text-sm font-medium">Manufacturers</legend>
      <div class="max-h-56 space-y-2 overflow-y-auto pr-2">
        <UCheckbox
          v-for="manufacturer in filters.manufacturers"
          :key="manufacturer"
          :model-value="isManufacturerSelected(manufacturer)"
          :label="manufacturer"
          @update:model-value="
            toggleManufacturer(manufacturer, $event === true)
          "
        />
      </div>
    </fieldset>

    <form class="space-y-6" @submit.prevent="applyRanges">
      <fieldset class="space-y-3">
        <legend class="text-sm font-medium">Price</legend>
        <div class="grid grid-cols-2 gap-3">
          <UInput
            v-model="rangeValues.minPrice"
            type="number"
            min="0"
            step="any"
            :placeholder="`Min ${filters.ranges.price.min}`"
            aria-label="Minimum price"
          />
          <UInput
            v-model="rangeValues.maxPrice"
            type="number"
            min="0"
            step="any"
            :placeholder="`Max ${filters.ranges.price.max}`"
            aria-label="Maximum price"
          />
        </div>
      </fieldset>

      <fieldset
        v-if="appliedQuery.category === 'battery' && filters.ranges.capacityKwh"
        class="space-y-3"
      >
        <legend class="text-sm font-medium">Capacity (kWh)</legend>
        <div class="grid grid-cols-2 gap-3">
          <UInput
            v-model="rangeValues.minCapacity"
            type="number"
            min="0"
            step="any"
            :placeholder="`Min ${filters.ranges.capacityKwh.min}`"
            aria-label="Minimum capacity"
          />
          <UInput
            v-model="rangeValues.maxCapacity"
            type="number"
            min="0"
            step="any"
            :placeholder="`Max ${filters.ranges.capacityKwh.max}`"
            aria-label="Maximum capacity"
          />
        </div>
      </fieldset>

      <fieldset
        v-if="appliedQuery.category === 'solar panel' && filters.ranges.powerW"
        class="space-y-3"
      >
        <legend class="text-sm font-medium">Power (W)</legend>
        <div class="grid grid-cols-2 gap-3">
          <UInput
            v-model="rangeValues.minPower"
            type="number"
            min="0"
            step="any"
            :placeholder="`Min ${filters.ranges.powerW.min}`"
            aria-label="Minimum power"
          />
          <UInput
            v-model="rangeValues.maxPower"
            type="number"
            min="0"
            step="any"
            :placeholder="`Max ${filters.ranges.powerW.max}`"
            aria-label="Maximum power"
          />
        </div>
      </fieldset>

      <p
        v-if="rangeError"
        :id="rangeErrorId"
        class="text-sm text-error"
        role="alert"
      >
        {{ rangeError }}
      </p>

      <UButton
        type="submit"
        block
        :aria-describedby="rangeError ? rangeErrorId : undefined"
      >
        Apply ranges
      </UButton>
    </form>
  </div>
</template>
