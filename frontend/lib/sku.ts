/** Client-side SKU suggestion; server also generates if SKU is omitted. */
export function generateSkuFromName(name: string): string {
  const slug =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 12) || "ITEM";

  const suffix = Math.floor(100 + Math.random() * 900);
  return `${slug}-${suffix}`;
}
