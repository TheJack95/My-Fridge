import { BarcodeProduct } from "../types";

/**
 * Open Food Facts is a free, open product database keyed by barcode
 * (EAN/UPC). No API key required. Docs: https://world.openfoodfacts.org/data
 *
 * When the project's own backend exists, this call should move server-side
 * (see docs/openapi.yaml `GET /barcode/{code}`) so the API key / rate
 * limiting / caching can live there instead of in the app.
 */
const OFF_BASE_URL = "https://world.openfoodfacts.org/api/v2/product";

export async function lookupBarcodeOnline(
  barcode: string
): Promise<BarcodeProduct | null> {
  const response = await fetch(
    `${OFF_BASE_URL}/${encodeURIComponent(barcode)}.json`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    return null;
  }

  const product = data.product;

  return {
    barcode,
    name: product.product_name || product.generic_name || "Prodotto sconosciuto",
    brand: product.brands,
    imageUrl: product.image_front_small_url || product.image_url,
    quantity: product.quantity,
  };
}
