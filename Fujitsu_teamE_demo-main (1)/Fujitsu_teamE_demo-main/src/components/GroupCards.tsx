import { useLocale } from "../hooks/useLocale";
import { Link } from "react-router-dom";
import { Users, Search, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { Group, Restaurant } from "../types";
import { allergenLabel } from "../data/constants";
import { Avatar } from "./ui";
export function GroupCards({
  groups,
  restaurants,
}: {
  groups: Group[];
  restaurants: Restaurant[];
}) {
  const { t } = useLocale();
  return (
    <div className="group-card-grid">
      {groups.map((group) => {
        const restaurant = restaurants.find(
          (r) => r.id === group.selectedRestaurantId,
        );
        const allergies = [
          ...new Set(group.members.flatMap((m) => m.allergies)),
        ];
        return (
          <article className="group-overview-card" key={group.id}>
            <div className="group-card-top">
              <span className="group-symbol">
                <Users size={21} />
              </span>
              <span className={`group-status ${restaurant ? "decided" : ""}`}>
                {t(
                  restaurant ? (
                    <>
                      <Check size={13} />
                      {t("お店決定済み")}
                    </>
                  ) : (
                    "お店を検討中"
                  ),
                )}
              </span>
            </div>
            <h3>
              <Link to={`/groups/${group.id}`}>{group.name}</Link>
            </h3>
            <div className="group-card-members">
              <div className="avatar-stack">
                {group.members.slice(0, 4).map((m, i) => (
                  <Avatar name={m.nickname} index={i} key={m.id} />
                ))}
              </div>
              <span>{t(`${group.members.length}人が参加中`)}</span>
            </div>
            <p className="group-member-names">
              {group.members
                .slice(0, 4)
                .map((m) => m.nickname)
                .join("・")}
              {t(
                group.members.length > 4
                  ? ` ほか${group.members.length - 4}人`
                  : "",
              )}
            </p>
            <p className="group-allergy-summary">
              <ShieldCheck size={15} />
              <span>
                {t(
                  allergies.length
                    ? `確認する食材：${allergies.map(allergenLabel).join("・")}`
                    : "アレルギーの登録なし",
                )}
              </span>
            </p>
            {restaurant && (
              <Link
                className="group-decision-link"
                to={`/groups/${group.id}/decision`}
              >
                {t("決定したお店：")}
                {restaurant.name}
                <ArrowUpRight size={14} />
              </Link>
            )}
            <div className="group-card-actions">
              <Link className="button secondary" to={`/groups/${group.id}`}>
                {t("参加者・招待")}
              </Link>
              <Link className="button primary" to={`/search?group=${group.id}`}>
                <Search size={16} />
                {t("お店を探す")}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
