import { describe, expect, it } from "vitest";
import { createRestaurants } from "../data/seed";
import { applyMenuPhoto } from "./menuUpdate";
const base = () => structuredClone(createRestaurants()[0]);
describe("applyMenuPhoto", () => {
  it("adds new menus as unconfirmed and marks their allergens unknown", () => {
    const r = base();
    const res = applyMenuPhoto(
      r,
      [{ name: "新作そば", price: 1300, ingredients: [], allergens: ["buckwheat"] }],
      "data:x",
      "x",
    );
    const added = res.restaurant.menus.at(-1)!;
    expect(res.added).toBe(1);
    expect(added.allergenReviewStatus).toBe("unconfirmed");
    expect(res.restaurant.allergenStatuses.buckwheat).not.toBe("not_used");
  });
  it("updates the price of an existing menu by name", () => {
    const r = base();
    const first = r.menus[0];
    const res = applyMenuPhoto(
      r,
      [{ name: first.name, price: 9999, ingredients: [], allergens: [] }],
      "data:x",
      "x",
    );
    expect(res.updated).toBe(1);
    expect(res.restaurant.menus).toHaveLength(r.menus.length);
    expect(res.restaurant.menus[0].price).toBe(9999);
  });
  it("adds the photo itself when no text was read", () => {
    const r = base();
    const res = applyMenuPhoto(r, [], "data:img", "ハンバーグ");
    const added = res.restaurant.menus.at(-1)!;
    expect(added.name).toBe("ハンバーグ");
    expect(added.image).toBe("data:img");
    expect(added.ingredients).toBeNull();
  });
});
