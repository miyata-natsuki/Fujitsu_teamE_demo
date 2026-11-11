import type { AppData } from "../types";
/** 「ひとり」で探したときの決定・予約を記録するための、1人だけのグループのID。 */
export const PERSONAL_GROUP_ID = "personal-solo";
/** ひとりで探したお店を決定する。1人グループ（なければ作成）に記録して、予約へつなげる。 */
export function withPersonalDecision(
  data: AppData,
  restaurantId: string,
): AppData {
  const existing = data.groups.find((g) => g.id === PERSONAL_GROUP_ID);
  const base = {
    id: PERSONAL_GROUP_ID,
    name: "ひとり",
    hostId: data.profile.id,
    ...existing,
    // 最新のプロフィールを反映する
    members: [data.profile],
    selectedRestaurantId: restaurantId,
  };
  return {
    ...data,
    groups: existing
      ? data.groups.map((g) => (g.id === PERSONAL_GROUP_ID ? base : g))
      : [...data.groups, base],
  };
}
