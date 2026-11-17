const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gr: "g",
  kg: "kg",
  mg: "mg",
  ml: "ml",
  cl: "cl",
  dl: "dl",
  l: "l",
  lt: "l",
  pz: "pz",
};

/**
 * Parses an Open Food Facts quantity string such as "500 g", "1,5 L" or
 * "33cl". Multi-packs ("6 x 125 g") and unknown units return null, so the
 * form keeps its defaults instead of guessing.
 */
export function parseProductQuantity(
  raw?: string
): { quantity: number; unit: string } | null {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\.?$/);
  if (!match) return null;
  const quantity = Number(match[1].replace(",", "."));
  const unit = UNIT_ALIASES[match[2].toLowerCase()];
  if (!unit || !Number.isFinite(quantity) || quantity <= 0) return null;
  return { quantity, unit };
}
