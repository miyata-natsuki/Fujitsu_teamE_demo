export type AllergenStatus = "used" | "not_used" | "unknown";
export interface UserProfile {
  id: string;
  nickname: string;
  allergies: string[];
  dislikedIngredients: string[];
  likedCuisines: string[];
  dislikedCuisines: string[];
}
export interface Reservation {
  restaurantId: string;
  date: string;
  time: string;
  people: number;
  name: string;
  note: string;
}
export interface Group {
  id: string;
  name: string;
  hostId: string;
  members: UserProfile[];
  selectedRestaurantId?: string;
  reservation?: Reservation;
}
export type Availability = "possible" | "conditional" | "impossible" | "unknown";
/** 店舗が対応できる範囲（未設定の古いデータはすべて未確認として扱う） */
export interface Accommodations {
  removeIngredients: Availability;
  separateUtensils: Availability;
  separateFryer: Availability;
  /** 食材を抜ける場合に、抜ける食材（メニューの使用食材から選ぶ） */
  removableIngredients?: string[];
  note: string;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  ingredients: string[] | null;
  allergens: string[];
  allergenReviewStatus: "confirmed" | "unconfirmed";
  accommodations?: Accommodations;
}
export interface Review {
  id: string;
  nickname: string;
  rating: number;
  text: string;
}
export interface Restaurant {
  id: string;
  name: string;
  area: string;
  /** 最寄り駅（未設定の古いデータはエリアの代表駅として扱う） */
  station?: string;
  cuisine: string;
  price: number;
  description: string;
  images: string[];
  address: string;
  location: { x: number; y: number };
  openingHours: string;
  rating: number;
  allergenStatuses: Partial<Record<string, AllergenStatus>>;
  crossContactInfo: string;
  badges?: string[];
  menus: MenuItem[];
  reviews: Review[];
}
export interface MockReceipt {
  id: string;
  image: string;
  products: {
    name: string;
    ingredient: string;
    candidates: string[];
    note?: string;
  }[];
}
export interface AppData {
  version: 1;
  profile: UserProfile;
  groups: Group[];
  restaurants: Restaurant[];
}
export interface Recommendation {
  member: UserProfile;
  menu: MenuItem;
  score: number;
  reasons: string[];
}
export interface RestaurantMatch {
  restaurant: Restaurant;
  score: number;
  /** 検索で指定したバッジ・対応範囲のうち、満たしている数 */
  requested: { matched: number; total: number };
  /** 使用あり・未確認などの注意点（空なら注意なし） */
  warnings: string[];
  /** 全員のアレルゲンを含まず確認済みのメニュー数（最も少ない人基準）／全メニュー数 */
  safeMenus: number;
  totalMenus: number;
  recommendations: Recommendation[];
}
