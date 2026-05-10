import { InventoryClient } from "./inventory-client";
import { getCategories, getDashboardSummary, getProducts } from "@/lib/api";
import type { Category, DashboardSummary, Product } from "@/lib/types";

const emptySummary: DashboardSummary = {
  totalProducts: 0,
  totalStockQuantity: 0,
  totalStockValue: 0,
  criticalThreshold: 5,
  criticalProducts: [],
};

export default async function Home() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let summary: DashboardSummary = { ...emptySummary };

  try {
    const [categoriesResult, productsResult, summaryResult] = await Promise.all([
      getCategories(),
      getProducts(),
      getDashboardSummary(),
    ]);

    categories = Array.isArray(categoriesResult) ? categoriesResult : [];
    products = Array.isArray(productsResult) ? productsResult : [];

    if (summaryResult && typeof summaryResult === "object") {
      summary = {
        totalProducts: summaryResult?.totalProducts ?? 0,
        totalStockQuantity: summaryResult?.totalStockQuantity ?? 0,
        totalStockValue: summaryResult?.totalStockValue ?? 0,
        criticalThreshold: summaryResult?.criticalThreshold ?? 5,
        criticalProducts: Array.isArray(summaryResult?.criticalProducts)
          ? summaryResult.criticalProducts
          : [],
      };
    }
  } catch {
    // API unavailable — page opens with safe defaults.
  }

  return (
    <InventoryClient
      initialCategories={categories}
      initialProducts={products}
      initialTotalStockQuantity={summary?.totalStockQuantity ?? 0}
      initialTotalStockValue={summary?.totalStockValue ?? 0}
      initialCriticalProducts={summary?.criticalProducts ?? []}
    />
  );
}
