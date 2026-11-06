import type { AppData } from "../types";
import { createInitialData } from "../data/seed";
export const STORAGE_KEY = "mogu-demo-v1";
export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createInitialData();
    saveData(initial);
    return initial;
  }
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Array.isArray(data.groups) ||
    !Array.isArray(data.restaurants) ||
    !data.profile?.id ||
    data.groups.some(
      (g: AppData["groups"][number]) => !Array.isArray(g.members),
    ) ||
    data.restaurants.some(
      (r: AppData["restaurants"][number]) =>
        !Array.isArray(r.menus) || !r.allergenStatuses,
    )
  )
    throw new Error(
      "保存データを読み込めません。データをリセットして再開してください。",
    );
  return data as AppData;
}
export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
