"use client";

import { useMemo, useState } from "react";
import {
  createProduct,
  getCategories,
  getDashboardSummary,
  getProducts,
  updateProductStock,
} from "@/lib/api";
import { generateSkuFromName } from "@/lib/sku";
import type { Category, Product } from "@/lib/types";

const INITIAL_FORM = {
  name: "",
  sku: "",
  quantity: 0,
  unitPrice: 0,
  categoryId: 0,
};

const inputClassName =
  "w-full min-h-12 rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-500 focus:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300";

type Props = {
  initialCategories: Category[];
  initialProducts: Product[];
  initialTotalStockQuantity: number;
  initialTotalStockValue: number;
  initialCriticalProducts: Product[];
};

export function InventoryClient({
  initialCategories,
  initialProducts,
  initialTotalStockQuantity,
  initialTotalStockValue,
  initialCriticalProducts,
}: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalStockQuantity, setTotalStockQuantity] = useState(initialTotalStockQuantity);
  const [totalStockValue, setTotalStockValue] = useState(initialTotalStockValue);
  const [criticalProducts, setCriticalProducts] = useState<Product[]>(initialCriticalProducts);
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    categoryId: initialCategories[0]?.id ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function refreshData() {
    setLoading(true);
    try {
      const [categoryData, productData, summary] = await Promise.all([
        getCategories(),
        getProducts(),
        getDashboardSummary(),
      ]);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setProducts(Array.isArray(productData) ? productData : []);

      if (summary && typeof summary === "object") {
        setTotalStockQuantity(summary?.totalStockQuantity ?? 0);
        setTotalStockValue(summary?.totalStockValue ?? 0);
        setCriticalProducts(
          Array.isArray(summary?.criticalProducts) ? summary.criticalProducts : [],
        );
      } else {
        setTotalStockQuantity(0);
        setTotalStockValue(0);
        setCriticalProducts([]);
      }

      if (categoryData?.length && categoryData.length > 0) {
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || categoryData[0]?.id,
        }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  const totalProducts = useMemo(() => products.length, [products]);

  function bumpFormQuantity(delta: number) {
    setForm((current) => ({
      ...current,
      quantity: Math.max(0, current.quantity + delta),
    }));
  }

  function applyAutoSku() {
    const name = form.name.trim();
    if (!name) {
      setMessage("Enter a product name first to generate a SKU.");
      return;
    }
    setMessage("");
    setForm((current) => ({ ...current, sku: generateSkuFromName(name) }));
  }

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const name = form.name.trim();
    const sku = form.sku.trim();
    const payload = {
      ...form,
      name,
      sku: sku || generateSkuFromName(name || "ITEM"),
    };

    try {
      await createProduct(payload);
      setForm((current) => ({ ...INITIAL_FORM, categoryId: current.categoryId }));
      setMessage("Product added successfully.");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add product.");
    }
  }

  async function handleStockUpdate(productId?: number, delta?: number) {
    setMessage("");
    if (typeof productId !== "number" || Number.isNaN(productId)) {
      setMessage("Could not update stock: product not found.");
      return;
    }

    if (typeof delta !== "number" || Number.isNaN(delta) || delta === 0) {
      setMessage("Could not update stock: invalid quantity.");
      return;
    }

    try {
      await updateProductStock(productId, {
        quantityDelta: delta,
        note: delta > 0 ? "Quick stock increase" : "Quick stock decrease",
      });
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update stock.");
    }
  }

  const stockValueFormatted = Number(totalStockValue ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Smart inventory dashboard
          </h1>
          <p className="text-base text-zinc-600">Overview and product management</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshData()}
          className="min-h-12 shrink-0 rounded-lg border-2 border-zinc-300 bg-white px-5 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </header>

      {message ? (
        <div className="rounded-lg border-2 border-zinc-300 bg-zinc-50 px-4 py-3 text-base text-zinc-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Total products" value={String(totalProducts)} />
        <DashboardCard title="Total units in stock" value={String(totalStockQuantity)} />
        <DashboardCard title="Total stock value" value={stockValueFormatted} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Low-stock items</h2>
          {criticalProducts.length === 0 ? (
            <p className="text-base text-zinc-500">No products are at a critical stock level.</p>
          ) : (
            <ul className="space-y-2 text-base">
              {(criticalProducts ?? []).map((item) => (
                <li
                  key={item?.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
                >
                  <span>{item?.name ?? "—"}</span>
                  <span className="font-semibold text-red-600">{item?.quantity ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Add new product</h2>
          <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
            <div>
              <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-zinc-700">
                Product name
              </label>
              <input
                id="product-name"
                className={inputClassName}
                placeholder="Type the product name, e.g. Wireless Mouse…"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                autoComplete="off"
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700">SKU</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  id="product-sku"
                  className={`${inputClassName} sm:flex-1`}
                  placeholder="Leave empty to auto-generate, or enter your own SKU…"
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={applyAutoSku}
                  className="min-h-12 shrink-0 rounded-lg border-2 border-zinc-800 bg-zinc-100 px-4 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-200"
                >
                  Auto-generate
                </button>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                If you submit with an empty SKU, one will be created from the product name.
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700">Stock quantity</span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="product-qty"
                  type="number"
                  inputMode="numeric"
                  className={`${inputClassName} sm:max-w-[14rem]`}
                  placeholder="Enter starting stock quantity…"
                  value={form.quantity}
                  onChange={(event) => {
                    const v = event.target.value;
                    if (v === "") {
                      setForm((current) => ({ ...current, quantity: 0 }));
                      return;
                    }
                    const n = Number.parseInt(v, 10);
                    if (!Number.isNaN(n)) {
                      setForm((current) => ({ ...current, quantity: Math.max(0, n) }));
                    }
                  }}
                  min={0}
                  step={1}
                  required
                />
                <div className="flex flex-wrap gap-2">
                  {([10, 50, 100] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => bumpFormQuantity(n)}
                      className="min-h-12 min-w-[4.5rem] rounded-lg border-2 border-emerald-700 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="product-price" className="mb-1 block text-sm font-medium text-zinc-700">
                Unit price
              </label>
              <input
                id="product-price"
                type="number"
                inputMode="decimal"
                className={inputClassName}
                placeholder="Enter the unit price, e.g. 19.99…"
                value={form.unitPrice}
                onChange={(event) => {
                  const v = event.target.value;
                  if (v === "") {
                    setForm((current) => ({ ...current, unitPrice: 0 }));
                    return;
                  }
                  const n = Number.parseFloat(v);
                  if (!Number.isNaN(n)) {
                    setForm((current) => ({ ...current, unitPrice: Math.max(0, n) }));
                  }
                }}
                min={0}
                step="any"
                required
              />
            </div>

            {(categories?.length ?? 0) > 0 ? (
              <div>
                <label htmlFor="product-category" className="mb-1 block text-sm font-medium text-zinc-700">
                  Category
                </label>
                <select
                  id="product-category"
                  className={`${inputClassName} cursor-pointer`}
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, categoryId: Number(event.target.value) }))
                  }
                  required
                >
                  {categories?.map((category) => (
                    <option key={category?.id} value={category?.id}>
                      {category?.name ?? "—"}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-950">
                No categories found. Check the API connection or run the backend seed.
              </p>
            )}

            <button
              type="submit"
              disabled={(categories?.length ?? 0) === 0}
              className="min-h-12 rounded-lg bg-zinc-900 px-4 py-3 text-base font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              Save product
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900">Product management</h2>
        {loading ? (
          <p className="text-base text-zinc-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b-2 border-zinc-200 text-left">
                  <th className="px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">SKU</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-3 py-3 font-semibold">Unit price</th>
                  <th className="px-3 py-3 font-semibold">Quick adjust</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((product) => (
                  <tr key={product?.id} className="border-b border-zinc-100">
                    <td className="px-3 py-3">{product?.name ?? "—"}</td>
                    <td className="px-3 py-3">{product?.categoryName ?? "—"}</td>
                    <td className="px-3 py-3">{product?.sku ?? "—"}</td>
                    <td className="px-3 py-3">{product?.quantity ?? 0}</td>
                    <td className="px-3 py-3">
                      {Number(product?.unitPrice ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {([50, 10, 1] as const).map((n) => (
                          <button
                            key={`p-${n}`}
                            type="button"
                            className="rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            onClick={() => void handleStockUpdate(product?.id, n)}
                          >
                            +{n}
                          </button>
                        ))}
                        {([-1, -10] as const).map((n) => (
                          <button
                            key={`m-${n}`}
                            type="button"
                            className="rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                            onClick={() => void handleStockUpdate(product?.id, n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
