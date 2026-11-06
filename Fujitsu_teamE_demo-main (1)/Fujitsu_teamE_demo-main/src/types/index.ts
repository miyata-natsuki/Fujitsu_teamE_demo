export type AllergenStatus = "used" | "not_used" | "unknown";
export interface UserProfile {
  id: string;
  nickname: string;
  allergies: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  likedCuisines: string[];
  dislikedCuisines: string[];
}
export interface Group {
  id: string;
  name: string;
  hostId: string;
  members: UserProfile[];
  selectedRestaurantId?: string;
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
  recommendations: Recommendation[];
}
export interface ExcludedRestaurant {
  restaurant: Restaurant;
  reasons: string[];
}
