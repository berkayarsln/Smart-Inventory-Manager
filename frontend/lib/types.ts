export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  categoryId: number;
  categoryName?: string | null;
};

export type DashboardSummary = {
  totalProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  criticalThreshold: number;
  criticalProducts: Product[];
};

export type CreateProductPayload = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  categoryId: number;
};

export type StockUpdatePayload = {
  quantityDelta: number;
  note?: string;
};
