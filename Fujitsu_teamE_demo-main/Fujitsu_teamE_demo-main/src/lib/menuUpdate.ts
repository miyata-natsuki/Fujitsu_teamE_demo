import type { MenuItem, Restaurant } from "../types";
import { photo } from "../data/seed";
import { reconcileAllergens } from "./matching";
import type { parseMenuText } from "./foodInput";
export const MAX_MENUS = 20;
type ParsedMenu = ReturnType<typeof parseMenuText>[number];
const key = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s/g, "");
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
/**
 * Merge menus read from an uploaded photo into a restaurant.
 * - Same name: price is updated; newly found ingredients/allergens are added and
 *   the menu goes back to "unconfirmed" so it is never recommended unchecked.
 * - New name: appended as an unconfirmed menu.
 * - Nothing readable: the photo itself is added as one unconfirmed menu.
 */
export function applyMenuPhoto(
  restaurant: Restaurant,
  parsed: ParsedMenu[],
  image: string,
  fallbackName: string,
): { restaurant: Restaurant; added: number; updated: number } {
  const photoOnly = parsed.length === 0;
  const items: (Omit<ParsedMenu, "ingredients"> & {
    ingredients: string[] | null;
  })[] = photoOnly
    ? [{ name: fallbackName, price: 1500, ingredients: null, allergens: [] }]
    : parsed;
  const menus: MenuItem[] = restaurant.menus.map((m) => ({ ...m }));
  let added = 0;
  let updated = 0;
  for (const item of items) {
    const existing = menus.find((m) => key(m.name) === key(item.name));
    if (existing) {
      const ingredients = union(existing.ingredients ?? [], item.ingredients ?? []);
      const allergens = union(existing.allergens, item.allergens);
      const grew =
        ingredients.length > (existing.ingredients?.length ?? 0) ||
        allergens.length > existing.allergens.length;
      existing.price = photoOnly ? existing.price : item.price;
      if (photoOnly) existing.image = image;
      if (grew) {
        existing.ingredients = ingredients;
        existing.allergens = allergens;
        existing.allergenReviewStatus = "unconfirmed";
      }
      updated++;
    } else if (menus.length < MAX_MENUS) {
      menus.push({
        id: crypto.randomUUID(),
        name: item.name,
        price: item.price,
        description: photoOnly
          ? "投稿された料理写真から追加。価格・原材料は未確認です。"
          : "メニュー写真から自動追加。原材料は別途確認してください。",
        image: photoOnly ? image : photo("salad"),
        ingredients: item.ingredients,
        allergens: item.allergens,
        allergenReviewStatus: "unconfirmed",
      });
      added++;
    }
  }
  return {
    restaurant: reconcileAllergens({ ...restaurant, menus }),
    added,
    updated,
  };
}
