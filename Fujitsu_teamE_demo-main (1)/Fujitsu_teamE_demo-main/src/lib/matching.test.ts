import { describe, expect, it } from "vitest";
import { createInitialData, createRestaurants } from "../data/seed";
import { ALLERGENS } from "../data/constants";
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
  likedIngredients: [],
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
describe("excluded restaurant menu allergy percentages", () => {
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
  it("keeps store-wide exclusion when menu overlap is zero", () => {
    const r = {
      ...data.restaurants[0],
      menus: [menu],
      allergenStatuses: { egg: "used" as const },
    };
    const members = [{ ...member, allergies: ["egg"] }];
    expect(allergyImpact(r, members).percent).toBe(0);
    expect(matchRestaurants([r], members, "", Infinity).excluded).toHaveLength(
      1,
    );
  });
});
describe("hard allergy constraints", () => {
  it("seed has 20 diverse restaurants, four menus and three reviews each; positive and excluded matches", () => {
    expect(data.restaurants).toHaveLength(20);
    for (const r of data.restaurants) {
      expect(r.menus.length).toBeGreaterThanOrEqual(3);
      expect(r.reviews).toHaveLength(3);
    }
    const result = matchRestaurants(
      data.restaurants,
      data.groups[0].members,
      "渋谷",
      4000,
    );
    expect(result.matches.length).toBeGreaterThanOrEqual(4);
    expect(result.excluded.length).toBeGreaterThan(0);
  });
  it.each(ALLERGENS)(
    "never recommends store with %s used, even when a menu is free of it",
    (id) => {
      const r = {
        ...data.restaurants[0],
        menus: [menu],
        allergenStatuses: { [id]: "used" as const },
      };
      const result = matchRestaurants(
        [r],
        [
          {
            ...member,
            allergies: [id],
            likedIngredients: menu.ingredients!,
            likedCuisines: [r.cuisine],
          },
        ],
        "",
        Infinity,
      );
      expect(result.matches).toEqual([]);
      expect(result.excluded[0].reasons[0]).toContain("使用あり");
    },
  );
  it.each(ALLERGENS)(
    "excludes both explicit unknown and missing %s declaration",
    (id) => {
      for (const statuses of [{ [id]: "unknown" as const }, {}]) {
        const result = matchRestaurants(
          [{ ...data.restaurants[0], allergenStatuses: statuses }],
          [{ ...member, allergies: [id] }],
          "",
          Infinity,
        );
        expect(result.matches).toHaveLength(0);
        expect(result.excluded[0].reasons[0]).toContain("未確認");
      }
    },
  );
  it("aggregates all group allergies, and reports every exclusion reason", () => {
    const r = {
      ...data.restaurants[0],
      allergenStatuses: { egg: "used" as const, milk: "unknown" as const },
    };
    const result = matchRestaurants(
      [r],
      [
        { ...member, allergies: ["egg"] },
        { ...member, id: "second", allergies: ["milk"] },
      ],
      "",
      Infinity,
    );
    expect(result.matches).toHaveLength(0);
    expect(result.excluded[0].reasons).toHaveLength(2);
  });
  it("filters area and budget before allergy evaluation", () => {
    const result = matchRestaurants(
      data.restaurants,
      data.groups[0].members,
      "新宿",
      2300,
    );
    expect(
      [...result.matches, ...result.excluded].every(
        (x) => x.restaurant.area === "新宿" && x.restaurant.price <= 2300,
      ),
    ).toBe(true);
    expect(result.filteredCount).toBe(1);
  });
  it("does not use unconfirmed menus or menus conflicting with a personal allergy", () => {
    const r = {
      ...data.restaurants[0],
      allergenStatuses: { egg: "not_used" as const },
      menus: [
        { ...menu, allergenReviewStatus: "unconfirmed" as const },
        { ...menu, id: "second", allergens: ["egg"] },
      ],
    };
    expect(
      matchRestaurants([r], [{ ...member, allergies: ["egg"] }], "", Infinity)
        .matches,
    ).toHaveLength(0);
  });
  it("reconciles confirmed menu/store contradictions and preserves unknown for unconfirmed use", () => {
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
  it("applies capped fixed ingredient rules, cuisine rules and clamps to 0–100", () => {
    expect(
      scoreMenu(
        menu,
        {
          ...member,
          likedIngredients: menu.ingredients!,
          likedCuisines: ["和食"],
        },
        "和食",
      ).score,
    ).toBe(95);
    expect(
      scoreMenu(
        menu,
        {
          ...member,
          dislikedIngredients: menu.ingredients!,
          dislikedCuisines: ["和食"],
        },
        "和食",
      ).score,
    ).toBe(0);
  });
  it("does not award or assume matches for missing ingredient information", () => {
    expect(
      scoreMenu(
        { ...menu, ingredients: null },
        { ...member, likedIngredients: ["野菜"] },
        "和食",
      ).score,
    ).toBe(50);
  });
  it("chooses an individual best menu and uses average × .7 + minimum × .3", () => {
    const r = {
      ...data.restaurants[0],
      menus: [menu, { ...menu, id: "beef", name: "牛", ingredients: ["牛肉"] }],
    };
    const members = [
      { ...member, id: "veg", likedIngredients: ["野菜", "魚"] },
      { ...member, id: "beef", likedIngredients: ["牛肉"] },
    ];
    const result = matchRestaurants([r], members, "", Infinity).matches[0];
    expect(result.recommendations.map((x) => x.menu.id)).toEqual([
      "menu",
      "beef",
    ]);
    expect(result.score).toBe(Math.round(((80 + 65) / 2) * 0.7 + 65 * 0.3));
  });
  it("changes ranking when preferences change without relaxing allergy conditions", () => {
    const r1 = {
      ...data.restaurants[0],
      id: "a",
      menus: [{ ...menu, ingredients: ["野菜"] }],
    };
    const r2 = {
      ...data.restaurants[0],
      id: "b",
      menus: [{ ...menu, ingredients: ["牛肉"] }],
    };
    expect(
      matchRestaurants(
        [r1, r2],
        [{ ...member, likedIngredients: ["野菜"] }],
        "",
        Infinity,
      ).matches[0].restaurant.id,
    ).toBe("a");
    expect(
      matchRestaurants(
        [r1, r2],
        [{ ...member, likedIngredients: ["牛肉"] }],
        "",
        Infinity,
      ).matches[0].restaurant.id,
    ).toBe("b");
  });
  it("returns no recommendations for no members or no eligible restaurants", () => {
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
