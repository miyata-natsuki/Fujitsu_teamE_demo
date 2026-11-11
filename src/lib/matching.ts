import type {
  MenuItem,
  Restaurant,
  UserProfile,
  RestaurantMatch,
  Accommodations,
} from "../types";
import {
  SCORE_WEIGHTS as W,
  AREA_STATIONS,
  allergenLabel,
} from "../data/constants";
import { restaurantLocation, type AreaSelection } from "./areaSelection";
/**
 * エリアでの絞り込み。県 → 市 → 駅の選択（AreaSelection）は、選んだところまでが一致するお店が対象。
 * 文字列の場合は、エリア名・駅名・住所に空白区切りの語がすべて含まれるお店が対象。
 * 何も選んでいない（空）場合は全エリア。
 */
export function areaMatches(restaurant: Restaurant, query: string | AreaSelection) {
  if (typeof query !== "string") {
    const loc = restaurantLocation(restaurant);
    return (
      (!query.prefecture || loc.prefecture === query.prefecture) &&
      (!query.city || loc.city === query.city) &&
      (!query.station || loc.station === query.station)
    );
  }
  const words = query.split(/[\s\u3000]+/).filter(Boolean);
  if (!words.length) return true;
  const station = restaurant.station ?? AREA_STATIONS[restaurant.area]?.[0] ?? "";
  const text = `${restaurant.area} ${station} ${restaurant.address}`;
  return words.every((w) => text.includes(w));
}export function allergyImpact(restaurant: Restaurant, members: UserProfile[]) {
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
    // 自由記述の苦手な食材にも対応するため、部分一致（例：「牛」→「牛肉」）で照合する。
    const disliked = (member.dislikedIngredients ?? []).filter((i) =>
      menu.ingredients!.some((ing) => ing.includes(i) || i.includes(ing)),
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
/**
 * 除外はせず、すべてのお店を0〜100のマッチ度で並べる。
 * 条件を指定しない場合：安全性60点＋好み40点。
 * こだわり条件を指定した場合：安全性50点＋好み20点＋指定条件30点。
 * 安全性は、店舗全体の使用状況（3割）と全員に安全なメニューの割合（7割）で決まる。
 * 「使用あり」「全員分のメニューなし」は最高40点、「未確認」は最高75点に抑える。
 */
export function matchRestaurants(
  restaurants: Restaurant[],
  members: UserProfile[],
  area: string | AreaSelection,
  budget: number | BudgetRange,
  wants: SearchWants = { badges: [], accommodations: [] },
) {
  const range: BudgetRange =
    typeof budget === "number" ? { min: 0, max: budget } : budget;
  const matches: RestaurantMatch[] = [];
  if (!members.length) return { matches, filteredCount: 0 };
  const filtered = restaurants.filter(
    (r) =>
      areaMatches(r, area) &&
      r.price >= range.min &&
      (range.max === undefined || r.price <= range.max),
  );
  const allergies = [...new Set(members.flatMap((m) => m.allergies))];
  for (const restaurant of filtered) {
    const warnings: string[] = [];
    let used = false;
    let unknown = false;
    const storePoints = allergies.map((id) => {
      const state = restaurant.allergenStatuses[id] ?? "unknown";
      if (state === "not_used") return 1;
      const names = members
        .filter((m) => m.allergies.includes(id))
        .map((m) => m.nickname)
        .join("・");
      if (state === "used") used = true;
      else unknown = true;
      warnings.push(
        `${names}さんの${allergenLabel(id)}アレルギー：店舗全体で${state === "used" ? "使用あり" : "使用状況が未確認"}です。`,
      );
      return state === "used" ? 0 : W.unknownStore;
    });
    const storeScore = storePoints.length
      ? storePoints.reduce((a, b) => a + b, 0) / storePoints.length
      : 1;
    const totalMenus = restaurant.menus.length;
    const safeCounts = members.map(
      (member) =>
        restaurant.menus.filter(
          (menu) =>
            menu.allergenReviewStatus === "confirmed" &&
            !menu.allergens.some((id) => member.allergies.includes(id)),
        ).length,
    );
    const safeMenus = Math.min(...safeCounts);
    const safeRatio = totalMenus ? safeMenus / totalMenus : 0;
    const picks = members.map((member) =>
      restaurant.menus
        .filter(
          (menu) =>
            menu.allergenReviewStatus === "confirmed" &&
            !menu.allergens.some((id) => member.allergies.includes(id)),
        )
        .map((menu) => ({
          member,
          menu,
          ...scoreMenu(menu, member, restaurant.cuisine),
        }))
        .sort((a, b) => b.score - a.score || a.menu.price - b.menu.price)[0],
    );
    const recommendations = picks.filter((p) => p !== undefined);
    const noMenu = picks.some((p) => !p);
    if (noMenu)
      warnings.push(
        "参加者全員に提案できる、アレルゲン情報確認済みのメニューがありません。",
      );
    // メニューがない人は0点として、最低点を下げる。
    const scores = picks.map((p) => p?.score ?? 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    // 好みの満点（基本点＋好きなジャンル）を100%として換算する。
    const preference = Math.min(
      1,
      (average * W.average + Math.min(...scores) * W.minimum) /
        (W.base + W.likedCuisine),
    );
    const requested = requestedFit(restaurant, wants);
    const condition = requested.total ? requested.matched / requested.total : 0;
    const safety =
      storeScore * W.storeShare + safeRatio * (1 - W.storeShare);
    const raw = requested.total
      ? safety * W.safetyPointsWithWants +
        preference * W.preferencePointsWithWants +
        condition * W.conditionPoints
      : safety * W.safetyPoints + preference * W.preferencePoints;
    const cap = used || noMenu ? W.usedCap : unknown ? W.unknownCap : 100;
    matches.push({
      restaurant,
      recommendations,
      score: Math.round(Math.min(raw, cap)),
      requested,
      warnings,
      safeMenus,
      totalMenus,
    });
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.restaurant.rating - a.restaurant.rating ||
      a.restaurant.id.localeCompare(b.restaurant.id),
  );
  return { matches, filteredCount: filtered.length };
}// Confirmed menu use always wins over a contradictory store-level declaration.
export function reconcileAllergens(restaurant: Restaurant): Restaurant {
  const statuses = { ...restaurant.allergenStatuses };
  for (const menu of restaurant.menus)
    for (const id of menu.allergens) {
      if (menu.allergenReviewStatus === "confirmed") statuses[id] = "used";
      else if (statuses[id] !== "used") statuses[id] = "unknown";
    }
  return { ...restaurant, allergenStatuses: statuses };
}
