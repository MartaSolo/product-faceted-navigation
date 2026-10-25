<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-default bg-default">
      <UContainer class="flex h-16 items-center justify-between">
        <NuxtLink
          to="/"
          class="rounded-sm text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Sun<span class="text-primary">.store</span>
        </NuxtLink>

        <nav aria-label="Primary navigation">
          <UButton to="/products" color="neutral" variant="ghost">
            Products
          </UButton>
        </nav>
      </UContainer>
    </header>

    <slot />
  </div>
</template>
