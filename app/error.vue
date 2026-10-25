<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

const statusCode = computed(() => props.error.statusCode || 500);

const errorContent = computed(() => {
  if (statusCode.value === 400) {
    return {
      title: "Invalid product filters",
      description:
        props.error.statusMessage ||
        "The selected filters are invalid. Return to the product listing and try again.",
    };
  }

  if (statusCode.value === 404) {
    return {
      title: "Page not found",
      description:
        "The requested page does not exist or is no longer available.",
    };
  }

  return {
    title: "Something went wrong",
    description:
      "We could not load this page. Try again or return to the product listing.",
  };
});

useSeoMeta({
  title: () => `${statusCode.value} – ${errorContent.value.title} | Sun.store`,
});

const returnToProducts = () => clearError({ redirect: "/products" });
const retry = () => reloadNuxtApp();
</script>

<template>
  <UApp>
    <NuxtLayout>
      <main class="flex flex-1 items-center">
        <UContainer class="w-full py-16 text-center sm:py-24">
          <div class="mx-auto max-w-lg space-y-6">
            <p class="text-sm font-semibold text-primary">
              Error {{ statusCode }}
            </p>
            <div class="space-y-3">
              <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
                {{ errorContent.title }}
              </h1>
              <p class="text-muted">
                {{ errorContent.description }}
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <UButton @click="returnToProducts"> View products </UButton>
              <UButton
                v-if="statusCode >= 500"
                color="neutral"
                variant="outline"
                icon="i-lucide-refresh-cw"
                @click="retry"
              >
                Try again
              </UButton>
            </div>
          </div>
        </UContainer>
      </main>
    </NuxtLayout>
  </UApp>
</template>
