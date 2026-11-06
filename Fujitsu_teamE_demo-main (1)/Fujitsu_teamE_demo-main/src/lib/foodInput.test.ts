import { describe, it, expect } from "vitest";
import { foodSearchMatch, parseFoodText, parseMenuText } from "./foodInput";
describe("食材検索とOCR候補", () => {
  it("読み方・表記揺れ・原材料名でアレルゲンを検索できる", () => {
    expect(foodSearchMatch("egg", "卵", "たまご")).toBe(true);
    expect(foodSearchMatch("milk", "乳", "チーズ")).toBe(true);
    expect(foodSearchMatch("shrimp", "えび", "エビ")).toBe(true);
    expect(foodSearchMatch("beef", "牛肉", "ぎゅう")).toBe(true);
    expect(foodSearchMatch("egg", "卵", "小麦")).toBe(false);
  });
  it("商品候補は未確認で保持し、候補なしから不使用を推測しない", () => {
    const p = parseFoodText(
      "合計 3000円\n牛乳 200円\n玉ねぎ 100円\n牛乳 200円",
    );
    expect(p).toHaveLength(2);
    expect(p[0].candidates).toContain("milk");
    expect(p[1].candidates).toEqual([]);
    expect(p.every((x) => !x.confirmed)).toBe(true);
  });
  it("メニュー名・円価格・食材・アレルゲン候補を抽出する", () => {
    const m = parseMenuText(
      "牛肉と玉ねぎのステーキ ￥2,200\nえびとトマトのパスタ 1800円",
    );
    expect(m[0].name).toBe("牛肉と玉ねぎのステーキ");
    expect(m[0].price).toBe(2200);
    expect(m[0].ingredients).toEqual(["牛肉", "玉ねぎ"]);
    expect(parseMenuText("玉ねぎとねぎのスープ 500円")[0].ingredients).toEqual(["玉ねぎ", "ねぎ"]);
    expect(m[1].allergens).toEqual(expect.arrayContaining(["shrimp", "wheat"]));
  });
  it("価格なし・空文字・大量入力にも対応する", () => {
    expect(parseMenuText("野菜プレート")[0].price).toBe(1500);
    expect(parseFoodText("")).toEqual([]);
    expect(
      parseMenuText(
        Array.from({ length: 50 }, (_, i) => `野菜プレート${i} 1000円`).join(
          "\n",
        ),
      ),
    ).toHaveLength(8);
  });
});
