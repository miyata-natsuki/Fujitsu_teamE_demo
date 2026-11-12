import { describe, expect, it } from "vitest";
import { createInitialData, createRestaurants } from "../data/seed";
import { ALLERGENS, AREA_STATIONS, LOCATIONS } from "../data/constants";
import {
  allergyImpact,
  matchRestaurants,
  reconcileAllergens,
  scoreMenu,
} from "./matching";
import type { MenuItem, UserProfile } from "../types";
const data = createInitialData();
const member: UserProfile = {
  id: "test",
  nickname: "テスト",
  allergies: [],
  dislikedIngredients: [],
  likedCuisines: [],
  dislikedCuisines: [],
};
const menu: MenuItem = {
  id: "menu",
  name: "定食",
  description: "",
  price: 1000,
  image: "",
  ingredients: ["野菜", "魚", "米", "トマト"],
  allergens: [],
  allergenReviewStatus: "confirmed",
};
describe("restaurant menu allergy percentages", () => {
  it("uses all menus as denominator and counts overlapping allergens only once per menu", () => {
    const r = {
      ...data.restaurants[0],
      menus: [
        { ...menu, id: "a", allergens: ["egg", "milk"] },
        { ...menu, id: "b", allergens: ["milk"] },
        { ...menu, id: "c", allergens: [] },
        {
          ...menu,
          id: "d",
          allergens: ["egg"],
          allergenReviewStatus: "unconfirmed" as const,
        },
      ],
    };
    const result = allergyImpact(r, [
      { ...member, id: "a", allergies: ["egg", "milk", "egg"] },
      { ...member, id: "b", allergies: ["milk"] },
    ]);
    expect(result).toMatchObject({
      affected: 2,
      total: 4,
      percent: 50,
      unconfirmed: 1,
      allergens: [
        { id: "egg", count: 1 },
        { id: "milk", count: 2 },
      ],
    });
    expect(result.menus[3]).toMatchObject({ confirmed: false, allergens: [] });
    expect(result.menus[0].allergens).toEqual(["egg", "milk"]);
  });
  it("handles personal search, no allergies and no registered menus", () => {
    const r = {
      ...data.restaurants[0],
      menus: [{ ...menu, allergens: ["egg"] }],
    };
    expect(allergyImpact(r, [{ ...member, allergies: ["egg"] }]).percent).toBe(
      100,
    );
    expect(allergyImpact(r, [{ ...member, allergies: [] }]).affected).toBe(0);
    expect(allergyImpact({ ...r, menus: [] }, []).percent).toBe(0);
  });
  it("keeps the store-wide warning and a low cap when menu overlap is zero", () => {
    const r = {
      ...data.restaurants[0],
      menus: [menu],
      allergenStatuses: { egg: "used" as const },
    };
    const members = [{ ...member, allergies: ["egg"] }];
    expect(allergyImpact(r, members).percent).toBe(0);
    const [m] = matchRestaurants([r], members, "", Infinity).matches;
    expect(m.warnings).toHaveLength(1);
    expect(m.score).toBeLessThanOrEqual(40);
  });
});
describe("match score without exclusion", () => {
  const safeStore = (id: string, extra = {}) => ({
    ...data.restaurants[0],
    id,
    menus: [menu],
    allergenStatuses: Object.fromEntries(
      ALLERGENS.map(([a]) => [a, "not_used" as const]),
    ),
    ...extra,
  });
  it("seed has 20 diverse restaurants, four menus and three reviews each; every filtered restaurant is listed in score order", () => {
    expect(data.restaurants).toHaveLength(20);
    for (const r of data.restaurants) {
      expect(r.menus.length).toBeGreaterThanOrEqual(3);
      expect(r.reviews).toHaveLength(3);
    }
    const result = matchRestaurants(
      data.restaurants,
      data.groups[0].members,
      "渋谷",
      { min: 0, max: 4000 },
    );
    expect(result.matches).toHaveLength(result.filteredCount);
    const scores = result.matches.map((m) => m.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(result.matches.some((m) => m.warnings.length > 0)).toBe(true);
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true);
  });
  it("gives 100 to a fully safe restaurant with the best preference", () => {
    const r = safeStore("perfect", { cuisine: "和食" });
    const result = matchRestaurants(
      [r],
      [{ ...member, likedCuisines: ["和食"] }],
      "",
      Infinity,
    );
    expect(result.matches[0].score).toBe(100);
    expect(result.matches[0].warnings).toEqual([]);
  });
  it.each(ALLERGENS)(
    "keeps a store with %s used in the list but caps it at 40",
    (id) => {
      const r = safeStore("x", { allergenStatuses: { [id]: "used" as const } });
      const result = matchRestaurants(
        [r],
        [{ ...member, allergies: [id], likedCuisines: [r.cuisine] }],
        "",
        Infinity,
      );
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].score).toBeLessThanOrEqual(40);
      expect(result.matches[0].warnings[0]).toContain("使用あり");
    },
  );
  it.each(ALLERGENS)(
    "caps both explicit unknown and missing %s declaration at 75",
    (id) => {
      for (const statuses of [{ [id]: "unknown" as const }, {}]) {
        const result = matchRestaurants(
          [safeStore("x", { allergenStatuses: statuses })],
          [{ ...member, allergies: [id], likedCuisines: ["和食"] }],
          "",
          Infinity,
        );
        expect(result.matches[0].score).toBeLessThanOrEqual(75);
        expect(result.matches[0].warnings[0]).toContain("未確認");
      }
    },
  );
  it("aggregates all group allergies and lists every warning", () => {
    const r = safeStore("x", {
      allergenStatuses: { egg: "used" as const, milk: "unknown" as const },
    });
    const result = matchRestaurants(
      [r],
      [
        { ...member, allergies: ["egg"] },
        { ...member, id: "second", allergies: ["milk"] },
      ],
      "",
      Infinity,
    );
    expect(result.matches[0].warnings).toHaveLength(2);
  });
  it("ranks a fully safe store above a risky one even with better preferences", () => {
    const risky = safeStore("risky", {
      cuisine: "和食",
      allergenStatuses: { egg: "used" as const },
    });
    const safe = safeStore("safe", { cuisine: "洋食" });
    const result = matchRestaurants(
      [risky, safe],
      [{ ...member, allergies: ["egg"], likedCuisines: ["和食"] }],
      "",
      Infinity,
    );
    expect(result.matches.map((m) => m.restaurant.id)).toEqual([
      "safe",
      "risky",
    ]);
  });
  it("counts menus that are safe for everyone out of all menus", () => {
    const r = safeStore("x", {
      menus: [
        menu,
        { ...menu, id: "b", allergens: ["egg"] },
        { ...menu, id: "c", allergenReviewStatus: "unconfirmed" as const },
        { ...menu, id: "d", allergens: ["milk"] },
      ],
    });
    const [m] = matchRestaurants(
      [r],
      [
        { ...member, allergies: ["egg"] },
        { ...member, id: "second", allergies: ["milk"] },
      ],
      "",
      Infinity,
    ).matches;
    expect(m.totalMenus).toBe(4);
    // 卵の人は2品、乳の人は2品（確認済みで該当なし）→ 最小の2品
    expect(m.safeMenus).toBe(2);
  });
  it("filters area and budget before scoring", () => {
    const result = matchRestaurants(
      data.restaurants,
      data.groups[0].members,
      "新宿",
      2300,
    );
    expect(
      result.matches.every(
        (x) => x.restaurant.area === "新宿" && x.restaurant.price <= 2300,
      ),
    ).toBe(true);
    expect(result.filteredCount).toBe(1);
    expect(result.matches).toHaveLength(1);
  });
  it("searches by area name, station name or area plus station", () => {
    const count = (q: string) =>
      matchRestaurants(data.restaurants, [member], q, Infinity).matches.length;
    const all = count("");
    expect(count("渋谷")).toBeGreaterThan(0);
    expect(count("渋谷")).toBeLessThan(all);
    expect(count("渋谷駅")).toBeGreaterThan(0);
    expect(count("渋谷駅")).toBeLessThanOrEqual(count("渋谷"));
    expect(count("渋谷 神泉駅")).toBeLessThanOrEqual(count("渋谷"));
    expect(count("渋谷　渋谷駅")).toBe(count("渋谷駅"));
    expect(count("存在しない駅")).toBe(0);
  });
  it("narrows by prefecture → city → station and applies only what was selected", () => {
    const count = (sel: {
      prefecture?: string;
      city?: string;
      station?: string;
    }) => matchRestaurants(data.restaurants, [member], sel, Infinity).matches.length;
    const all = count({});
    expect(count({ prefecture: "東京都" })).toBe(all);
    const shibuya = count({ prefecture: "東京都", city: "渋谷区" });
    expect(shibuya).toBeGreaterThan(0);
    expect(shibuya).toBeLessThan(all);
    const station = count({
      prefecture: "東京都",
      city: "渋谷区",
      station: "渋谷駅",
    });
    expect(station).toBeGreaterThan(0);
    expect(station).toBeLessThanOrEqual(shibuya);
    expect(count({ prefecture: "大阪府" })).toBe(0);
  });
  it("offers all 47 prefectures with cities and stations, including the demo areas", () => {
    expect(LOCATIONS).toHaveLength(47);
    expect(new Set(LOCATIONS.map((l) => l.prefecture)).size).toBe(47);
    for (const l of LOCATIONS)
      for (const c of l.cities) expect(c.stations.length).toBeGreaterThan(0);
    const tokyo = LOCATIONS.find((l) => l.prefecture === "東京都")!;
    for (const [area, stations] of Object.entries(AREA_STATIONS)) {
      const city = tokyo.cities.find((c) => c.area === area);
      expect(city).toBeDefined();
      for (const s of stations) expect(city!.stations).toContain(s);
    }
  });
  it("matches free-text disliked ingredients by partial name", () => {
    expect(
      scoreMenu(menu, { ...member, dislikedIngredients: ["トマトソース"] }, "和食")
        .score,
    ).toBe(30);
    expect(
      scoreMenu(menu, { ...member, dislikedIngredients: ["ほうれん草"] }, "和食")
        .score,
    ).toBe(50);
  });
  it("treats a free-text allergy as unconfirmed at stores", () => {
    const [m] = matchRestaurants(
      [safeStore("x")],
      [{ ...member, allergies: ["キウイ"] }],
      "",
      Infinity,
    ).matches;
    expect(m.warnings[0]).toContain("未確認");
    expect(m.score).toBeLessThanOrEqual(75);
  });
  it("supports budget ranges with a lower bound and an open upper bound", () => {
    const all = (range: { min: number; max?: number }) =>
      matchRestaurants(data.restaurants, [member], "", range).matches;
    expect(all({ min: 5000 }).every((m) => m.restaurant.price >= 5000)).toBe(
      true,
    );
    expect(
      all({ min: 2000, max: 3000 }).every(
        (m) => m.restaurant.price >= 2000 && m.restaurant.price <= 3000,
      ),
    ).toBe(true);
  });
  it("flags members without any confirmed safe menu and caps the score", () => {
    const r = safeStore("x", {
      menus: [
        { ...menu, allergenReviewStatus: "unconfirmed" as const },
        { ...menu, id: "second", allergens: ["egg"] },
      ],
    });
    const [m] = matchRestaurants(
      [r],
      [{ ...member, allergies: ["egg"] }],
      "",
      Infinity,
    ).matches;
    expect(m.warnings.join()).toContain("メニューがありません");
    expect(m.score).toBeLessThanOrEqual(40);
    expect(m.safeMenus).toBe(0);
  });
  it("adds the requested badge and accommodation match rate to the score", () => {
    const base = safeStore("a", { cuisine: "和食" });
    const withBadge = { ...base, id: "b", badges: ["halal"] };
    const result = matchRestaurants([base, withBadge], [member], "", Infinity, {
      badges: ["halal"],
      accommodations: [],
    });
    expect(result.matches[0].restaurant.id).toBe("b");
    expect(result.matches[0].requested).toEqual({ matched: 1, total: 1 });
    expect(result.matches[1].requested).toEqual({ matched: 0, total: 1 });
    // 条件が1つも合わない店舗は、安全50＋好み20 の70点が上限
    expect(result.matches[1].score).toBeLessThanOrEqual(70);
    expect(result.matches[0].score).toBeGreaterThan(result.matches[1].score);
  });
  it("lowers the safety points in proportion to the share of safe menus", () => {
    const bad = (id: string) => ({ ...menu, id, allergens: ["egg"] });
    const r = safeStore("x", {
      menus: [menu, bad("b"), bad("c"), bad("d")],
    });
    const all = safeStore("y", { menus: [menu, menu, menu, menu] });
    const members = [{ ...member, allergies: ["egg"] }];
    const [low] = matchRestaurants([r], members, "", Infinity).matches;
    const [high] = matchRestaurants([all], members, "", Infinity).matches;
    expect(low.safeMenus).toBe(1);
    expect(high.score).toBeGreaterThan(low.score);
    // 安全なメニュー1/4 → 安全点 60×(0.3＋0.7×0.25)
    expect(low.score).toBeLessThan(80);
  });  it("reconciles confirmed menu/store contradictions and preserves unknown for unconfirmed use", () => {
    const r = {
      ...data.restaurants[0],
      allergenStatuses: { egg: "not_used" as const, milk: "not_used" as const },
      menus: [
        { ...menu, allergens: ["egg"] },
        {
          ...menu,
          id: "second",
          allergens: ["milk"],
          allergenReviewStatus: "unconfirmed" as const,
        },
      ],
    };
    const fixed = reconcileAllergens(r);
    expect(fixed.allergenStatuses.egg).toBe("used");
    expect(fixed.allergenStatuses.milk).toBe("unknown");
    expect(r.allergenStatuses.egg).toBe("not_used");
  });
  it("every initial menu allergen is reflected in store use", () => {
    for (const r of createRestaurants())
      for (const m of r.menus)
        for (const a of m.allergens) expect(r.allergenStatuses[a]).toBe("used");
  });
});
describe("preference scoring", () => {
  it("applies cuisine rules and clamps to 0–100", () => {
    expect(
      scoreMenu(menu, { ...member, likedCuisines: ["和食"] }, "和食").score,
    ).toBe(65);
    expect(
      scoreMenu(menu, { ...member, dislikedCuisines: ["和食"] }, "和食").score,
    ).toBe(35);
    expect(scoreMenu(menu, member, "和食").score).toBe(50);
    // 苦手な食材は1つにつき20点減点（上限40点）。食材が未確認のメニューは減点しない。
    expect(
      scoreMenu(menu, { ...member, dislikedIngredients: ["魚"] }, "和食").score,
    ).toBe(30);
    expect(
      scoreMenu(
        menu,
        { ...member, dislikedIngredients: ["野菜", "魚", "米"] },
        "和食",
      ).score,
    ).toBe(10);
    expect(
      scoreMenu(
        { ...menu, ingredients: null },
        { ...member, dislikedIngredients: ["魚"] },
        "和食",
      ).score,
    ).toBe(50);
  });
  it("scores preference as average × .7 + minimum × .3 across members (safety 60 + preference 40)", () => {
    const r = { ...data.restaurants[0], cuisine: "和食", menus: [menu] };
    const members = [
      { ...member, id: "a", likedCuisines: ["和食"] },
      { ...member, id: "b" },
    ];
    const result = matchRestaurants([r], members, "", Infinity).matches[0];
    // 全員に安全なので安全性は満点の60点。好みは満点65点を100%として40点分。
    const preference = (((65 + 50) / 2) * 0.7 + 50 * 0.3) / 65;
    expect(result.score).toBe(Math.round(60 + preference * 40));
  });
  it("changes ranking when preferences change without relaxing allergy conditions", () => {
    const r1 = { ...data.restaurants[0], id: "a", cuisine: "和食", menus: [menu] };
    const r2 = { ...data.restaurants[0], id: "b", cuisine: "洋食", menus: [menu] };
    expect(
      matchRestaurants(
        [r1, r2],
        [{ ...member, likedCuisines: ["和食"] }],
        "",
        Infinity,
      ).matches[0].restaurant.id,
    ).toBe("a");
    expect(
      matchRestaurants(
        [r1, r2],
        [{ ...member, likedCuisines: ["洋食"] }],
        "",
        Infinity,
      ).matches[0].restaurant.id,
    ).toBe("b");
  });  it("returns no recommendations for no members or no eligible restaurants", () => {
    expect(
      matchRestaurants(data.restaurants, [], "", Infinity).matches,
    ).toEqual([]);
    expect(
      matchRestaurants(data.restaurants, [member], "存在しないエリア", 1)
        .matches,
    ).toEqual([]);
  });
  it("is pure and leaves the input untouched", () => {
    const copy = structuredClone(data);
    matchRestaurants(data.restaurants, data.groups[0].members, "", Infinity);
    expect(data).toEqual(copy);
  });
});
