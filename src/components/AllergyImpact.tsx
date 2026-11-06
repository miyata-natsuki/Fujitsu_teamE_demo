import { useLocale } from "../hooks/useLocale";
import { allergyImpact } from "../lib/matching";
import { allergenLabel } from "../data/constants";
import type { Restaurant, UserProfile } from "../types";

export function AllergyImpact({
  restaurant,
  members,
}: {
  restaurant: Restaurant;
  members: UserProfile[];
}) {
  const { t } = useLocale();
  const impact = allergyImpact(restaurant, members);
  return (
    <div className="allergy-impact">
      <div className="allergy-impact-heading">
        <span>{t("アレルギーに該当するメニューの割合")}</span>
        <b>{impact.total ? `${impact.percent}%` : "—"}</b>
      </div>
      <div className="allergy-impact-bar" aria-hidden="true">
        <span style={{ width: `${impact.percent}%` }} />
      </div>
      <p>
        {t("該当メニュー / 全メニュー")}: {impact.affected} / {impact.total}{" "}
        {t("品")}
      </p>
      {impact.allergens.map(({ id, count }) => (
        <div className="allergy-impact-row" key={id}>
          <span>{t(allergenLabel(id))}</span>
          <span>
            {count} / {impact.total} {t("品")} ·{" "}
            {Math.round((count / impact.total) * 100)}%
          </span>
        </div>
      ))}
      {impact.unconfirmed > 0 && (
        <p>
          {t("アレルギー情報が未確認のメニュー")}: {impact.unconfirmed}{" "}
          {t("品")}
        </p>
      )}
      {!impact.total ? (
        <p>{t("メニューが未登録のため割合を計算できません。")}</p>
      ) : (
        <details className="allergy-menu-breakdown">
          <summary>{t("メニュー別の内訳")}</summary>
          {impact.menus.map(({ menu, confirmed, allergens }) => (
            <div className="allergy-impact-row" key={menu.id}>
              <span>{t(menu.name)}</span>
              <span>
                {!confirmed
                  ? t("未確認")
                  : allergens.length
                    ? t(allergens.map(allergenLabel).join("・"))
                    : t("登録情報での該当なし")}
              </span>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
