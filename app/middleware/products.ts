import {
  buildProductQuery,
  parseProductQuery,
} from "#shared/utils/product-query";

export default defineNuxtRouteMiddleware((to) => {
  const queryResult = parseProductQuery(to.query);

  if (!queryResult.success) {
    if (queryResult.reason === "duplicate") {
      throw createError({
        statusCode: 400,
        statusMessage: `Query parameter "${queryResult.key}" cannot be repeated.`,
      });
    }

    if (queryResult.reason === "unknown-category") {
      throw createError({
        statusCode: 404,
        statusMessage: "Product category not found.",
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Invalid product query.",
    });
  }

  const normalizedQuery = buildProductQuery(queryResult.data);

  const normalizedRoute = {
    path: to.path,
    query: normalizedQuery,
    hash: to.hash,
  };

  const normalizedFullPath = useRouter().resolve(normalizedRoute).fullPath;

  if (normalizedFullPath !== to.fullPath) {
    return navigateTo(normalizedRoute, {
      redirectCode: 301,
      replace: true,
    });
  }
});
