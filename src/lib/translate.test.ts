import { describe, expect, it } from "vitest";
import { translate } from "./translate";
import { TRANSLATIONS, isLocale } from "./translations";
import {
  ALLERGENS,
  INGREDIENTS,
  CUISINES,
  STATUS_LABELS,
  SAFETY_NOTICE,
} from "../data/constants";
import { foodSearchMatch } from "./foodInput";
describe("multilingual display", () => {
  it("has translations for all ingredients, allergens, cuisines and safety declarations", () => {
    for (const text of [
      ...ALLERGENS.map(([, name]) => name),
      ...INGREDIENTS,
      ...CUISINES,
      ...Object.values(STATUS_LABELS),
      SAFETY_NOTICE,
    ]) {
      expect(TRANSLATIONS[text], text).toHaveLength(3);
      expect(
        TRANSLATIONS[text].every((value) => value.trim().length > 0),
        text,
      ).toBe(true);
    }
  });
  it("keeps Japanese and custom names unchanged", () => {
    expect(translate("アレルギー", "ja")).toBe("アレルギー");
    expect(translate("Alex's dinner party", "ko")).toBe("Alex's dinner party");
    expect(translate("あかり", "en")).toBe("あかり");
  });
  it.each(["en", "zh", "ko"] as const)(
    "translates status and strict exclusion reasons in %s",
    (locale) => {
      const result = translate(
        "Alexさんの卵アレルギー：店舗全体で使用状況が未確認です。",
        locale,
      );
      expect(result).toContain("Alex");
      expect(result).not.toContain("使用状況が未確認");
      expect(translate("不使用確認済み", locale)).not.toBe("不使用確認済み");
      expect(translate(SAFETY_NOTICE, locale)).not.toBe(SAFETY_NOTICE);
    },
  );
  it("translates searchable form labels and numbers", () => {
    expect(translate("好きな食材を全選択", "en")).toBe(
      "Select all Liked ingredients",
    );
    expect(translate("卵を解除", "ko")).toBe("달걀 해제");
    expect(translate("1人が参加中", "en")).toBe("1 member");
    expect(translate("3人が参加中", "en")).toBe("3 members");
    expect(translate("読み取り中… 45%", "zh")).toBe("读取中… 45%");
    expect(translate("好きな食材：牛肉・野菜", "en")).toBe(
      "Liked ingredients: Beef · Vegetables",
    );
  });
  it("supports ingredient search in each language while keeping canonical IDs", () => {
    for (const query of ["milk", "牛奶", "우유"])
      expect(foodSearchMatch("milk", "乳", query)).toBe(true);
    for (const query of ["shrimp", "虾", "새우"])
      expect(foodSearchMatch("shrimp", "えび", query)).toBe(true);
  });
  it("accepts only the supported locale preferences", () => {
    for (const locale of ["ja", "en", "zh", "ko"])
      expect(isLocale(locale)).toBe(true);
    for (const locale of ["fr", "", null, undefined])
      expect(isLocale(locale)).toBe(false);
  });
});
