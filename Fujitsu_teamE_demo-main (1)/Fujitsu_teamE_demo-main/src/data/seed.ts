import type {
  AppData,
  MenuItem,
  Restaurant,
  UserProfile,
  MockReceipt,
} from "../types";
import { ALLERGENS } from "./constants";
export const photo = (name: string) =>
  `${import.meta.env.BASE_URL}images/${name}.jpg`;
const profile = (
  id: string,
  nickname: string,
  allergies: string[],
  likes: string[],
  dislikes: string[],
  cuisines: string[],
): UserProfile => ({
  id,
  nickname,
  allergies,
  likedIngredients: likes,
  dislikedIngredients: dislikes,
  likedCuisines: cuisines,
  dislikedCuisines: [],
});
export const DEMO_MEMBERS = [
  profile(
    "host",
    "あかり",
    ["egg"],
    ["野菜", "魚"],
    ["パクチー"],
    ["和食", "カフェ"],
  ),
  profile(
    "guest-1",
    "ゆうた",
    ["milk"],
    ["牛肉", "じゃがいも"],
    ["きのこ"],
    ["焼肉", "洋食"],
  ),
  profile(
    "guest-2",
    "みさき",
    ["peanut"],
    ["トマト", "野菜"],
    ["豚肉"],
    ["イタリアン", "和食"],
  ),
  profile(
    "guest-3",
    "けん",
    [],
    ["鶏肉", "米"],
    ["えび"],
    ["和食", "韓国料理"],
  ),
];
type Dish = [string, string[], string[], number, string];
const dishes: Record<string, Dish[]> = {
  和食: [
    ["季節野菜と炭火焼き魚の定食", ["魚", "野菜", "米"], ["soy"], 1600, "fish"],
    [
      "鶏の塩麹焼きと土鍋ごはん",
      ["鶏肉", "米", "玉ねぎ"],
      ["chicken"],
      1500,
      "japanese",
    ],
    [
      "彩り野菜のせいろ蒸し",
      ["野菜", "じゃがいも", "きのこ"],
      ["soy"],
      1350,
      "salad",
    ],
    [
      "牛肉と季節野菜の炭火焼き",
      ["牛肉", "トマト", "野菜"],
      ["beef", "soy"],
      2200,
      "steak",
    ],
  ],
  洋食: [
    [
      "ハーブチキンのロースト",
      ["鶏肉", "じゃがいも", "トマト"],
      ["chicken"],
      1900,
      "japanese",
    ],
    [
      "自家製ハンバーグ",
      ["牛肉", "玉ねぎ", "じゃがいも"],
      ["beef", "egg", "milk", "wheat"],
      1850,
      "steak",
    ],
    ["季節野菜のスープ", ["野菜", "じゃがいも"], ["milk"], 900, "salad"],
    ["サーモンと野菜のグリル", ["魚", "野菜", "トマト"], [], 2000, "fish"],
  ],
  中華: [
    [
      "香味野菜と鶏肉の蒸しごはん",
      ["鶏肉", "米", "野菜"],
      ["chicken", "soy", "sesame"],
      1400,
      "chinese",
    ],
    [
      "野菜たっぷり焼き餃子",
      ["豚肉", "野菜", "玉ねぎ"],
      ["pork", "wheat", "soy"],
      950,
      "chinese",
    ],
    [
      "麻婆豆腐の土鍋仕立て",
      ["豆腐", "豚肉", "米"],
      ["soy", "pork"],
      1500,
      "chinese",
    ],
    ["トマトと卵の炒めもの", ["トマト", "野菜"], ["egg"], 1100, "chinese"],
  ],
  イタリアン: [
    [
      "トマトと季節野菜のパスタ",
      ["トマト", "野菜", "玉ねぎ"],
      ["wheat"],
      1700,
      "pasta",
    ],
    ["牛肉のタリアータ", ["牛肉", "野菜", "トマト"], ["beef"], 2300, "steak"],
    ["きのこのオイルパスタ", ["きのこ", "野菜"], ["wheat"], 1800, "pasta"],
    ["モッツァレラのカプレーゼ", ["チーズ", "トマト"], ["milk"], 1200, "salad"],
  ],
  韓国料理: [
    [
      "彩り野菜のビビンバ",
      ["野菜", "米", "牛肉"],
      ["sesame", "soy", "beef"],
      1600,
      "korean",
    ],
    [
      "鶏肉の韓国風グリル",
      ["鶏肉", "野菜", "米"],
      ["chicken", "soy"],
      1800,
      "korean",
    ],
    ["豚肉と野菜のスープ", ["豚肉", "野菜"], ["pork", "soy"], 1500, "korean"],
    ["豆腐ときのこのチゲ", ["豆腐", "きのこ", "米"], ["soy"], 1400, "korean"],
  ],
  焼肉: [
    [
      "国産牛の炭火焼きセット",
      ["牛肉", "米", "野菜"],
      ["beef", "soy"],
      2800,
      "steak",
    ],
    [
      "鶏ももと季節野菜のグリル",
      ["鶏肉", "野菜", "米"],
      ["chicken", "soy"],
      1700,
      "steak",
    ],
    ["豚肩ロースの塩焼き", ["豚肉", "じゃがいも"], ["pork"], 1900, "steak"],
    ["焼き野菜とごはんセット", ["野菜", "トマト", "米"], [], 1300, "salad"],
  ],
  寿司: [
    ["季節の握り八貫", ["魚", "米"], ["soy"], 2600, "sushi"],
    [
      "サーモンと野菜の海鮮丼",
      ["魚", "米", "野菜"],
      ["soy", "sesame"],
      1900,
      "sushi",
    ],
    ["炙りまぐろの握り", ["魚", "米"], ["soy"], 1800, "sushi"],
    [
      "えびと彩り野菜のちらし",
      ["えび", "米", "野菜"],
      ["shrimp", "soy"],
      2100,
      "sushi",
    ],
  ],
  カフェ: [
    [
      "季節野菜のデリボウル",
      ["野菜", "トマト", "じゃがいも"],
      [],
      1400,
      "salad",
    ],
    [
      "チキンと雑穀米のプレート",
      ["鶏肉", "米", "野菜"],
      ["chicken"],
      1600,
      "salad",
    ],
    [
      "豆腐ときのこの温かいサラダ",
      ["豆腐", "きのこ", "野菜"],
      ["soy"],
      1350,
      "salad",
    ],
    ["焼き野菜のトマトリゾット", ["トマト", "米", "野菜"], [], 1500, "cafe"],
  ],
  エスニック: [
    [
      "チキンのスパイスカレー",
      ["鶏肉", "米", "トマト"],
      ["chicken"],
      1500,
      "curry",
    ],
    ["野菜のココナッツカレー", ["野菜", "じゃがいも", "米"], [], 1400, "curry"],
    [
      "ハーブ香る牛肉のサラダ",
      ["牛肉", "野菜", "パクチー"],
      ["beef", "soy"],
      1650,
      "salad",
    ],
    [
      "えびの香味炒めとライス",
      ["えび", "米", "パクチー"],
      ["shrimp", "soy"],
      1800,
      "curry",
    ],
  ],
};
const specs: [string, string, string, number, string, string[]?, string[]?][] =
  [
    ["季節の食卓 こもれび", "渋谷", "和食", 2500, "fish"],
    ["GREEN TABLE", "渋谷", "カフェ", 2000, "salad"],
    ["炭とごはん つむぎ", "渋谷", "焼肉", 3500, "steak"],
    ["スパイス日和", "渋谷", "エスニック", 2000, "curry"],
    ["おばんざい 凪", "渋谷", "和食", 3000, "japanese", [], ["milk"]],
    ["Bistro SOL", "渋谷", "洋食", 4000, "steak"],
    ["Trattoria 余白", "渋谷", "イタリアン", 3500, "pasta", ["egg"]],
    ["花椒食堂", "渋谷", "中華", 2500, "chinese", ["peanut"]],
    ["鮨 つきのわ", "新宿", "寿司", 5000, "sushi"],
    ["庭と野菜", "新宿", "カフェ", 2200, "salad"],
    ["炭火 肉の音", "新宿", "焼肉", 4500, "steak"],
    ["土鍋と魚 まどい", "新宿", "和食", 3200, "fish"],
    ["SEOUL NOTE", "新宿", "韓国料理", 2800, "korean"],
    ["Pasta & Pane", "新宿", "イタリアン", 3000, "pasta"],
    ["洋食 アトリエ", "池袋", "洋食", 2800, "steak"],
    ["アジアの台所 風", "池袋", "エスニック", 2300, "curry", ["peanut"]],
    ["木の実食堂", "池袋", "和食", 2500, "japanese", [], ["milk"]],
    ["小皿中華 燈", "池袋", "中華", 2600, "chinese"],
    ["MORNING ROOM", "池袋", "カフェ", 1800, "cafe", ["milk", "egg"]],
    ["韓国ごはん 月白", "池袋", "韓国料理", 3000, "korean", ["egg"]],
  ];
export function createRestaurants(): Restaurant[] {
  return specs.map(
    (
      [name, area, cuisine, price, image, extraUsed = [], unknown = []],
      index,
    ) => {
      const menus: MenuItem[] = dishes[cuisine].map(
        ([dish, ingredients, allergens, amount, picture], j) => ({
          id: `r${index + 1}-m${j}`,
          name: dish,
          description: "旬の食材を大切に、素材のおいしさを引き出した一皿。",
          price: amount,
          image: photo(picture),
          ingredients,
          allergens,
          allergenReviewStatus: "confirmed",
        }),
      );
      const signature: Record<number, string> = {
        4: "焼きさばと秋野菜のおばんざい",
        8: "職人おまかせ 季節の握り",
        9: "畑のごちそうデリボウル",
        10: "赤身牛の炭火焼き盛り合わせ",
        11: "銀鮭の塩焼きと土鍋ごはん",
        12: "石焼き野菜ビビンバ",
        13: "完熟トマトとナスのパスタ",
        14: "レモンハーブチキンのロースト",
        15: "じっくり煮込んだチキンカレー",
        16: "炭火焼き魚と旬野菜の定食",
        17: "香味チキンの蒸しごはん",
        18: "週替わりの彩りデリプレート",
        19: "牛肉とナムルのビビンバ",
      };
      if (signature[index]) menus[0].name = signature[index];
      if (index === 6) menus[2].allergenReviewStatus = "unconfirmed";
      if (index === 7) menus[1].ingredients = null;
      const used = new Set([
        ...menus.flatMap((m) => m.allergens),
        ...extraUsed,
      ]);
      const allergenStatuses = Object.fromEntries(
        ALLERGENS.map(([id]) => [
          id,
          used.has(id) ? "used" : unknown.includes(id) ? "unknown" : "not_used",
        ]),
      );
      return {
        id: `r${index + 1}`,
        name,
        area,
        cuisine,
        price,
        description: `${area}の路地に佇む、${cuisine}のお店。季節ごとに変わる食材と、ゆっくり過ごせる空間を大切にしています。友人との食事にも、いつもの一人ごはんにも。`,
        images: [photo(image), menus[1].image],
        address: `東京都${area}区こもれび町${index + 1}-2-3（架空）`,
        location: { x: 30 + ((index * 13) % 40), y: 25 + ((index * 17) % 50) },
        openingHours:
          index % 2 ? "11:00–21:00（火曜定休）" : "11:30–22:00（月曜定休）",
        rating: Number((4.9 - (index % 5) * 0.1).toFixed(1)),
        allergenStatuses,
        crossContactInfo:
          "調理器具・作業台の共用があります。意図しない混入を防ぐための対応は、利用前に店舗へ直接確認が必要です。（デモ情報）",
        menus,
        reviews: [
          {
            id: "1",
            nickname: "なつ",
            rating: 5,
            text: "野菜がおいしくて、落ち着いた雰囲気。友人とゆっくり過ごせました。",
          },
          {
            id: "2",
            nickname: "りょう",
            rating: 4,
            text: "食材について事前に質問したところ、メニューごとに説明してくれました。実際の対応は直接ご確認ください。",
          },
          {
            id: "3",
            nickname: "はる",
            rating: 5,
            text: "季節ごとのメニューが楽しみになるお店。またみんなで訪れたいです。",
          },
        ],
      } as Restaurant;
    },
  );
}
export function createInitialData(): AppData {
  return {
    version: 1,
    profile: structuredClone(DEMO_MEMBERS[0]),
    groups: [
      {
        id: "weekend",
        name: "週末ごはんの会",
        hostId: "host",
        members: structuredClone(DEMO_MEMBERS),
      },
    ],
    restaurants: createRestaurants(),
  };
}
export const MOCK_RECEIPT: MockReceipt = {
  id: "sample",
  image: `${import.meta.env.BASE_URL}images/receipt.svg`,
  products: [
    { name: "牛ひき肉 500g", ingredient: "牛肉", candidates: ["beef"] },
    {
      name: "パン粉 200g",
      ingredient: "パン粉",
      candidates: ["wheat"],
      note: "加工食品です。乳・卵などは商品ラベルで別途確認してください。",
    },
    { name: "牛乳 1L", ingredient: "牛乳", candidates: ["milk"] },
    { name: "卵 10個", ingredient: "卵", candidates: ["egg"] },
    { name: "玉ねぎ 3個", ingredient: "玉ねぎ", candidates: [] },
    {
      name: "しょうゆ 500ml",
      ingredient: "しょうゆ",
      candidates: ["wheat", "soy"],
      note: "商品によって原材料が異なります。ラベルで確認してください。",
    },
  ],
};
