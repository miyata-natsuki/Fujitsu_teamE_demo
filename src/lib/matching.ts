import type {
  MenuItem,
  Restaurant,
  UserProfile,
  RestaurantMatch,
  ExcludedRestaurant,
  Accommodations,
} from "../types";
import { SCORE_WEIGHTS as W, allergenLabel } from "../data/constants";
export function allergyImpact(restaurant: Restaurant, members: UserProfile[]) {
  const allergies = [...new Set(members.flatMap((member) => member.allergies))];
  const menus = restaurant.menus.map((menu) => ({
    menu,
    confirmed: menu.allergenReviewStatus === "confirmed",
    allergens:
      menu.allergenReviewStatus === "confirmed"
        ? allergies.filter((id) => menu.allergens.includes(id))
        : [],
  }));
  const total = menus.length;
  const affected = menus.filter((entry) => entry.allergens.length > 0).length;
  const unconfirmed = menus.filter((entry) => !entry.confirmed).length;
  const allergens = allergies
    .map((id) => ({
      id,
      count: menus.filter((entry) => entry.allergens.includes(id)).length,
    }))
    .filter((entry) => entry.count > 0);
  return {
    affected,
    total,
    unconfirmed,
    percent: total ? Math.round((affected / total) * 100) : 0,
    allergens,
    menus,
  };
}
export function scoreMenu(
  menu: MenuItem,
  member: UserProfile,
  cuisine: string,
) {
  let score = W.base;
  const reasons: string[] = [];
  if (menu.ingredients) {
    const disliked = (member.dislikedIngredients ?? []).filter((i) =>
      menu.ingredients!.includes(i),
    );
    score -= Math.min(
      disliked.length * -W.dislikedIngredient,
      W.dislikedIngredientCap,
    );
    if (disliked.length) reasons.push(`苦手な食材：${disliked.join("・")}`);
  }
  if (member.likedCuisines.includes(cuisine)) {
    score += W.likedCuisine;
    reasons.push(`好きなジャンル：${cuisine}`);
  }
  if (member.dislikedCuisines.includes(cuisine)) {
    score += W.dislikedCuisine;
    reasons.push(`苦手なジャンル：${cuisine}`);
  }
  if (!reasons.length) reasons.push("好みの登録と照合した標準スコア");
  return { score: Math.max(0, Math.min(100, score)), reasons };
}
export interface BudgetRange {
  min: number;
  max?: number;
}
export interface SearchWants {
  badges: string[];
  accommodations: string[];
}
/** その店が、指定バッジ・対応範囲のうちいくつ満たしているか。 */
export function requestedFit(restaurant: Restaurant, wants: SearchWants) {
  const total = wants.badges.length + wants.accommodations.length;
  const badges = restaurant.badges ?? [];
  const matched =
    wants.badges.filter((b) => badges.includes(b)).length +
    wants.accommodations.filter((key) =>
      restaurant.menus.some((m) => {
        const v = m.accommodations?.[key as keyof Accommodations];
        return v === "possible" || v === "conditional";
      }),
    ).length;
  return { matched, total };
}
export function matchRestaurants(
  restaurants: Restaurant[],
  members: UserProfile[],
  area: string,
  budget: number | BudgetRange,
  wants: SearchWants = { badges: [], accommodations: [] },
) {
  const range: BudgetRange =
    typeof budget === "number" ? { min: 0, max: budget } : budget;
  const matches: RestaurantMatch[] = [],
    excluded: ExcludedRestaurant[] = [];
  if (!members.length) return { matches, excluded, filteredCount: 0 };
  const filtered = restaurants.filter(
    (r) => (!area || r.area === area) &&
      r.price >= range.min &&
      (range.max === undefined || r.price <= range.max),
  );
  const allergies = [...new Set(members.flatMap((m) => m.allergies))];
  for (const restaurant of filtered) {
    const reasons = allergies.flatMap((id) => {
      const state = restaurant.allergenStatuses[id] ?? "unknown";
      if (state === "not_used") return [];
      const names = members
        .filter((m) => m.allergies.includes(id))
        .map((m) => m.nickname)
        .join("・");
      return [
        `${names}さんの${allergenLabel(id)}アレルギー：店舗全体で${state === "used" ? "使用あり" : "使用状況が未確認"}です。`,
      ];
    });
    // A missing allergen declaration never means absence. Store-wide use is a hard constraint.
    if (reasons.length) {
      excluded.push({ restaurant, reasons });
      continue;
    }
    const recommendations = members.map((member) => {
      const choices = restaurant.menus.filter(
        (menu) =>
          menu.allergenReviewStatus === "confirmed" &&
          !menu.allergens.some((id) => member.allergies.includes(id)),
      );
      return choices
        .map((menu) => ({
          member,
          menu,
          ...scoreMenu(menu, member, restaurant.cuisine),
        }))
        .sort((a, b) => b.score - a.score || a.menu.price - b.menu.price)[0];
    });
    if (recommendations.some((r) => !r)) {
      excluded.push({
        restaurant,
        reasons: [
          "参加者全員に提案できる、アレルゲン情報確認済みのメニューがありません。",
        ],
      });
      continue;
    }
    const scores = recommendations.map((r) => r.score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const base = Math.round(
      average * W.average + Math.min(...scores) * W.minimum,
    );
    const requested = requestedFit(restaurant, wants);
    // 指定バッジ・対応範囲は加点のみ。アレルギーの除外条件は緩和しない。
    const score = requested.total
      ? Math.round(
          base * (1 - W.requested) +
            (requested.matched / requested.total) * 100 * W.requested,
        )
      : base;
    matches.push({ restaurant, recommendations, score, requested });
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.restaurant.rating - a.restaurant.rating ||
      a.restaurant.id.localeCompare(b.restaurant.id),
  );
  return { matches, excluded, filteredCount: filtered.length };
}
// Confirmed menu use always wins over a contradictory store-level declaration.
export function reconcileAllergens(restaurant: Restaurant): Restaurant {
  const statuses = { ...restaurant.allergenStatuses };
  for (const menu of restaurant.menus)
    for (const id of menu.allergens) {
      if (menu.allergenReviewStatus === "confirmed") statuses[id] = "used";
      else if (statuses[id] !== "used") statuses[id] = "unknown";
    }
  return { ...restaurant, allergenStatuses: statuses };
}
