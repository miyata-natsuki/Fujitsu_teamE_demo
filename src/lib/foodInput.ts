import { TRANSLATIONS } from "./translations";
import { ALLERGENS, INGREDIENTS } from "../data/constants";
const aliases: Record<string, string[]> = {
  egg: ["たまご", "卵", "玉子"],
  milk: ["乳", "牛乳", "ミルク", "チーズ", "バター", "ヨーグルト"],
  wheat: ["小麦", "こむぎ", "パン", "うどん", "パスタ"],
  buckwheat: ["そば", "蕎麦"],
  peanut: ["落花生", "ピーナッツ", "らっかせい"],
  shrimp: ["えび", "海老", "エビ"],
  crab: ["かに", "蟹"],
  walnut: ["くるみ", "胡桃"],
  soy: ["大豆", "だいず", "豆腐", "とうふ", "醤油", "しょうゆ"],
  sesame: ["ごま", "胡麻"],
  beef: ["牛肉", "ぎゅうにく", "ビーフ", "牛ひき肉", "牛挽肉"],
  pork: ["豚肉", "ぶたにく", "ポーク"],
  chicken: ["鶏肉", "とりにく", "チキン"],
};
const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/\s/g, "");
export function foodSearchMatch(id: string, label: string, query: string) {
  const key = ALLERGENS.find(([, name]) => name === label)?.[0] ?? id;
  return [label, ...(aliases[key] ?? []), ...(TRANSLATIONS[label] ?? [])].some(
    (s) => normalize(s).includes(normalize(query)),
  );
}
export type ExtractedProduct = {
  name: string;
  ingredient: string;
  candidates: string[];
  confirmed: boolean;
  note?: string;
};
export function parseFoodText(text: string): ExtractedProduct[] {
  return [
    ...new Set(
      text
        .normalize("NFKC")
        .split(/\n/)
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 1 &&
            !/^(合計|小計|消費税|電話|TEL|お預り|お釣り|領収|レシート)/i.test(
              normalize(s),
            ) &&
            !/メニュー表|デモ用|架空|模擬ocr/.test(normalize(s)) &&
            !/^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(s),
        ),
    ),
  ]
    .slice(0, 40)
    .map((name) => {
      const candidates = ALLERGENS.filter(([id]) =>
        aliases[id].some((a) => normalize(name).includes(normalize(a))),
      ).map(([id]) => id);
      const ingredient =
        INGREDIENTS.find((i) => normalize(name).includes(normalize(i))) ??
        (candidates.length
          ? ALLERGENS.find(([id]) => id === candidates[0])![1]
          : "未特定");
      return {
        name,
        ingredient,
        candidates,
        confirmed: false,
        note: "文字からの候補です。原材料表示と照合してください。候補なしも不使用の証明にはなりません。",
      };
    });
}
function menuIngredients(text: string) {
  let remaining = normalize(text);
  const found = new Set<string>();
  // Longest names first: 玉ねぎ must not also become ねぎ.
  for (const ingredient of [...INGREDIENTS].sort(
    (a, b) => b.length - a.length,
  )) {
    const key = normalize(ingredient);
    if (remaining.includes(key)) {
      found.add(ingredient);
      remaining = remaining.replaceAll(key, "");
    }
  }
  return INGREDIENTS.filter((ingredient) => found.has(ingredient));
}
export function parseMenuText(text: string) {
  return parseFoodText(text)
    .filter((p) => !/^(MENU|ランチメニュー|おすすめ|価格|税込)/i.test(p.name))
    .map((p) => {
      const priceMatch = p.name.match(
        /(?:[¥￥]\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})\s*(?:円)?\s*$/,
      );
      const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : 1500;
      const name = (
        priceMatch ? p.name.slice(0, priceMatch.index).trim() : p.name
      )
        .replace(/[¥￥]$/, "")
        .trim();
      return {
        name,
        price: price > 0 && price <= 100000 ? price : 1500,
        ingredients: menuIngredients(name),
        allergens: p.candidates,
      };
    })
    .filter((p) => p.name.length > 1)
    .slice(0, 8);
}
