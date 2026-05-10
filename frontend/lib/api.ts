import type {
  Category,
  CreateProductPayload,
  DashboardSummary,
  Product,
  StockUpdatePayload,
} from "./types";

function resolveApiBaseUrl(): string {
  const primary = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const legacy = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (primary) {
    return primary.replace(/\/$/, "");
  }

  if (legacy) {
    const base = legacy.replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  return "http://localhost:5255/api";
}

const API_BASE_URL = resolveApiBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach the API.");
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Request failed.");
  }

  if (response.status === 204 || !text.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid API response.");
  }
}

export function getCategories() {
  return request<Category[]>("/categories");
}

export function getProducts() {
  return request<Product[]>("/products");
}

export function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard/summary");
}

export function createProduct(payload: CreateProductPayload) {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProductStock(productId: number, payload: StockUpdatePayload) {
  return request<{ id: number; quantity: number }>(`/products/${productId}/stock`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
