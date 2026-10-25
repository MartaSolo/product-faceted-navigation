import type { Product } from "#shared/types/product";

export default defineEventHandler(async (event) => {
  // Keep the loading error boundary separate from query processing so expected
  // 400/404 errors are not caught and converted into a 500 response.
  let products: Product[];

  try {
    products = await getProducts();
  } catch (error) {
    console.error("Failed to load product data.", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to load products.",
    });
  }

  return createProductsResponse(products, getQuery(event));
});
