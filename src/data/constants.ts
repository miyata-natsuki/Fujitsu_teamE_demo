export const ALLERGENS = [
  ["egg", "卵"],
  ["milk", "乳"],
  ["wheat", "小麦"],
  ["buckwheat", "そば"],
  ["peanut", "落花生"],
  ["shrimp", "えび"],
  ["crab", "かに"],
  ["walnut", "くるみ"],
  ["soy", "大豆"],
  ["sesame", "ごま"],
  ["beef", "牛肉"],
  ["pork", "豚肉"],
  ["chicken", "鶏肉"],
] as const;
export const INGREDIENTS = [
  "牛肉",
  "豚肉",
  "鶏肉",
  "魚",
  "チーズ",
  "トマト",
  "きのこ",
  "野菜",
  "えび",
  "じゃがいも",
  "米",
  "豆腐",
  "玉ねぎ",
  "パクチー",
  "卵",
  "牛乳",
  "小麦",
  "そば",
  "落花生",
  "かに",
  "くるみ",
  "大豆",
  "ごま",
  "にんじん",
  "ピーマン",
  "なす",
  "ブロッコリー",
  "ほうれん草",
  "ねぎ",
  "にんにく",
  "レバー",
  "納豆",
  "いか",
  "たこ",
  "貝",
  "アボカド",
];
export const CUISINES = [
  "和食",
  "洋食",
  "中華",
  "イタリアン",
  "韓国料理",
  "焼肉",
  "寿司",
  "カフェ",
  "エスニック",
];
export const AREAS = ["渋谷", "新宿", "池袋"];
/** エリアごとの最寄り駅（デモ用。駅名での検索に使う） */
export const AREA_STATIONS: Record<string, string[]> = {
  渋谷: ["渋谷駅", "神泉駅", "代官山駅"],
  新宿: ["新宿駅", "新宿三丁目駅", "西新宿駅"],
  池袋: ["池袋駅", "大塚駅", "目白駅"],
};
/** 県 → 市（区） → 駅（デモは東京都のみ）。area は店舗データのエリア名。 */
export const LOCATIONS: {
  prefecture: string;
  cities: { name: string; area: string; stations: string[] }[];
}[] = [
  {
    prefecture: "東京都",
    cities: [
      { name: "渋谷区", area: "渋谷", stations: AREA_STATIONS["渋谷"] },
      { name: "新宿区", area: "新宿", stations: AREA_STATIONS["新宿"] },
      { name: "豊島区", area: "池袋", stations: AREA_STATIONS["池袋"] },
    ],
  },
];
export const cityOfArea = (area: string) =>
  LOCATIONS.flatMap((l) => l.cities).find((c) => c.area === area)?.name;
/** 予算の範囲（max なしは「〜円以上」） */
export const BUDGET_RANGES: { id: string; min: number; max?: number }[] = [
  { id: "0-1000", min: 0, max: 1000 },
  { id: "1000-2000", min: 1000, max: 2000 },
  { id: "2000-3000", min: 2000, max: 3000 },
  { id: "3000-5000", min: 3000, max: 5000 },
  { id: "5000-", min: 5000 },
];
export const budgetLabel = (r: { min: number; max?: number }) =>
  r.max === undefined
    ? `${r.min.toLocaleString("ja-JP")}円以上`
    : `${r.min.toLocaleString("ja-JP")}円～${r.max.toLocaleString("ja-JP")}円`;
export const BADGES = [
  ["halal", "ハラール対応"],
  ["removal", "アレルギー除去対応可"],
  ["vegetarian", "ベジタリアン対応"],
  ["vegan", "ヴィーガン対応"],
  ["gluten_free", "グルテンフリー対応可"],
  ["kids_allergy", "アレルギー対応メニューあり"],
] as const;
export const badgeLabel = (id: string) =>
  BADGES.find((b) => b[0] === id)?.[1] ?? id;
export const SCORE_WEIGHTS = {
  base: 50,
  dislikedIngredient: -20,
  dislikedIngredientCap: 40,
  likedCuisine: 15,
  dislikedCuisine: -15,
  // マッチ度の配点（100点満点）と、安全上の上限
  // 条件を指定しない場合：安全60＋好み40
  safetyPoints: 60,
  preferencePoints: 40,
  // こだわり条件を指定した場合：安全50＋好み20＋条件30
  safetyPointsWithWants: 50,
  preferencePointsWithWants: 20,
  conditionPoints: 30,
  // 安全点のうち、店舗全体の使用状況の割合（残りは安全なメニューの割合）
  storeShare: 0.3,
  unknownStore: 0.4,
  usedCap: 40,
  unknownCap: 75,
  average: 0.7,
  minimum: 0.3,
};
export const STATUS_LABELS = {
  used: "使用あり",
  not_used: "不使用確認済み",
  unknown: "未確認",
};
export const AVAILABILITY_LABELS = {
  possible: "対応可能",
  conditional: "条件付きで対応可能",
  impossible: "対応不可",
  unknown: "未確認",
};
export const ACCOMMODATION_ITEMS = [
  ["removeIngredients", "食材を抜く（除去対応）"],
  ["separateUtensils", "調理器具・食器を分ける"],
  ["separateFryer", "揚げ油・フライヤーを分ける"],
] as const;
export const allergenLabel = (id: string) =>
  ALLERGENS.find((a) => a[0] === id)?.[1] ?? id;
export const SAFETY_NOTICE =
  "架空データを使ったデモです。登録情報は安全性を保証しません。意図しない混入の可能性もあるため、実際の利用時には必ず店舗へ確認してください。";
