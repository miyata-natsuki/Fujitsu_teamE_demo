import { AREA_STATIONS, cityOfArea } from "../data/constants";
import type { Restaurant } from "../types";
/** エリアの選択。県 → 市 → 駅の順に選び、選んだところまでが検索条件になる。 */
export interface AreaSelection {
  prefecture?: string;
  city?: string;
  station?: string;
}
export const areaSelectionLabel = (s: AreaSelection) =>
  [s.prefecture, s.city, s.station].filter(Boolean).join(" › ");
export const isEmptyArea = (s: AreaSelection) =>
  !s.prefecture && !s.city && !s.station;
export const sameArea = (a: AreaSelection, b: AreaSelection) =>
  a.prefecture === b.prefecture &&
  a.city === b.city &&
  a.station === b.station;
const KEYS = ["prefecture", "city", "station"] as const;
export function areaFromParams(p: URLSearchParams): AreaSelection {
  const s: AreaSelection = {};
  for (const k of KEYS) {
    const v = p.get(k);
    if (v) s[k] = v;
  }
  return s;
}
export function areaToParams(p: URLSearchParams, s: AreaSelection) {
  for (const k of KEYS) {
    if (s[k]) p.set(k, s[k]!);
    else p.delete(k);
  }
  return p;
}
/** 店舗の県・市・駅（未設定の古いデータはエリアから補う） */
export function restaurantLocation(r: Restaurant) {
  return {
    prefecture: r.prefecture ?? "東京都",
    city: r.city ?? cityOfArea(r.area),
    station: r.station ?? AREA_STATIONS[r.area]?.[0],
  };
}
const HISTORY_KEY = "mogu-area-history-v2";
export function loadAreaHistory(): AreaSelection[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(v)
      ? v.filter((x) => x && typeof x === "object" && !isEmptyArea(x))
      : [];
  } catch {
    return [];
  }
}
export function saveAreaHistory(s: AreaSelection): AreaSelection[] {
  const current = loadAreaHistory();
  if (isEmptyArea(s)) return current;
  const next = [s, ...current.filter((h) => !sameArea(h, s))].slice(0, 5);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // 保存できない環境では履歴を残さない
  }
  return next;
}