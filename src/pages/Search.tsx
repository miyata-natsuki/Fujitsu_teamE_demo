import { useLocale } from "../hooks/useLocale";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  Users,
  SlidersHorizontal,
  ShieldCheck,
  ChevronDown,
  Utensils,
  Fish,
  Beef,
  Coffee,
  Soup,
  Pizza,
  Flame,
  Leaf,
  Check,
  Plus,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import { AllergyImpact } from "../components/AllergyImpact";
import { ForceDecideButton } from "../components/ForceDecideButton";
import {
  AREAS,
  BUDGET_RANGES,
  BADGES,
  ACCOMMODATION_ITEMS,
  CUISINES,
  allergenLabel,
  budgetLabel,
} from "../data/constants";
import { matchRestaurants } from "../lib/matching";
import { RestaurantCard, Notice, Empty } from "../components/ui";
const cuisineIcons = [
  Fish,
  Utensils,
  Soup,
  Pizza,
  Flame,
  Beef,
  Fish,
  Coffee,
  Leaf,
];
const PERSONAL = "__personal";
export default function SearchPage({ home = false }: { home?: boolean }) {
  const { t } = useLocale();
  const { data, update } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const personal = params.get("mode") === "personal";
  const selectedGroup = params.get("group") || data.groups[0]?.id;
  const group = data.groups.find((g) => g.id === selectedGroup);
  const members = personal ? [data.profile] : (group?.members ?? []);
  const [area, setArea] = useState(params.get("area") ?? "渋谷");
  const [budget, setBudget] = useState(params.get("budget") || "3000-5000");
  const list = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  const toggleWant = (key: "badges" | "accom", v: string) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      const cur = list(key);
      const upd = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (upd.length) next.set(key, upd.join(","));
      else next.delete(key);
      return next;
    });
  const [cuisine, setCuisine] = useState("");
  const [searched, setSearched] = useState(false);
  const appliedArea = params.get("area") ?? "渋谷";
  const appliedRange =
    BUDGET_RANGES.find((b) => b.id === (params.get("budget") || "3000-5000")) ??
    BUDGET_RANGES[3];
  const wants = { badges: list("badges"), accommodations: list("accom") };
  const result = matchRestaurants(
    data.restaurants,
    members,
    appliedArea,
    appliedRange,
    wants,
  );
  const matches = result.matches.filter(
    (m) => !cuisine || m.restaurant.cuisine === cuisine,
  );
  const allergies = [...new Set(members.flatMap((m) => m.allergies))];
  const choose = (id: string, force = false) => {
    if (
      !group ||
      (!force && !result.matches.some((m) => m.restaurant.id === id))
    )
      return;
    if (
      update((d) => ({
        ...d,
        groups: d.groups.map((g) =>
          g.id === group.id ? { ...g, selectedRestaurantId: id } : g,
        ),
      }))
    )
      navigate(`/groups/${group.id}/decision`);
  };
  return (
    <>
      <section className={`search-intro ${home ? "home-intro" : ""}`}>
        <div>
          <div className="eyebrow">
            <span />
            {t("A TABLE FOR EVERYONE")}
          </div>
          <h1>
            {t(
              home ? (
                <>
                  {t("おいしい時間を、")}
                  <br className="mobile-break" />
                  <span>{t("みんなで。")}</span>
                </>
              ) : (
                "みんなの「好き」で、お店を探そう。"
              ),
            )}
          </h1>
          <p>
            {t(
              "アレルギーも、好き嫌いも。みんなの食の好みから、ぴったりの一軒を。",
            )}
          </p>
        </div>
      </section>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setParams((p) => {
            const next = new URLSearchParams(p);
            next.set("area", area);
            next.set("budget", budget);
            return next;
          });
          setSearched(true);
        }}
      >
        <label>
          <MapPin size={20} />
          <div>
            <span>{t("エリア")}</span>
            <select
              aria-label={t("エリア")}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">{t("すべてのエリア")}</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {t(a)}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <Utensils size={20} />
          <div>
            <span>{t("予算・1人あたり")}</span>
            <select
              aria-label={t("予算")}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              {BUDGET_RANGES.map((b) => (
                <option key={b.id} value={b.id}>
                  {t(budgetLabel(b))}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <Users size={20} />
          <div>
            <span>{t("グループ")}</span>
            <select
              aria-label={t("検索するグループ")}
              value={personal ? PERSONAL : (selectedGroup ?? "")}
              onChange={(e) => {
                const v = e.target.value;
                setParams((p) => {
                  const next = new URLSearchParams(p);
                  if (v === PERSONAL) next.set("mode", "personal");
                  else {
                    next.set("mode", "group");
                    next.set("group", v);
                  }
                  return next;
                });
                setCuisine("");
              }}
            >
              <option value={PERSONAL}>
                {t("ひとり")}（{data.profile.nickname}）
              </option>
              {data.groups.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.name}
                  {t("·")}
                  {g.members.length}
                  {t("人")}
                </option>
              ))}
            </select>
          </div>
        </label>
        <button className="button primary search-submit">
          <SearchIcon size={19} />
          {t("お店を探す")}
        </button>
      </form>
      <details className="excluded-section" open={wants.badges.length + wants.accommodations.length > 0}>
        <summary>
          <span>
            <SlidersHorizontal size={20} />
            <strong>{t("こだわり条件（バッジ・対応範囲）")}</strong>
            {wants.badges.length + wants.accommodations.length > 0 && (
              <span className="tag neutral">
                {wants.badges.length + wants.accommodations.length}
                {t("件")}
              </span>
            )}
          </span>
          <ChevronDown size={19} />
        </summary>
        <p className="muted small">
          {t(
            "指定した条件に合うお店ほど、おすすめ度が高くなります。アレルギーによる除外条件は緩めません。",
          )}
        </p>
        <h4>{t("お店のバッジ")}</h4>
        <div className="tags">
          {BADGES.map(([id, label]) => (
            <label className="checkbox-label" key={id}>
              <input
                type="checkbox"
                checked={wants.badges.includes(id)}
                onChange={() => toggleWant("badges", id)}
              />
              {t(label)}
            </label>
          ))}
        </div>
        <h4>{t("アレルギーへの対応範囲")}</h4>
        <div className="tags">
          {ACCOMMODATION_ITEMS.map(([key, label]) => (
            <label className="checkbox-label" key={key}>
              <input
                type="checkbox"
                checked={wants.accommodations.includes(key)}
                onChange={() => toggleWant("accom", key)}
              />
              {t(label)}
            </label>
          ))}
        </div>
      </details>      <div className="search-safety">
        <ShieldCheck size={17} />
        <p>
          {members.length}
          {t("人のアレルギーを検索に反映")}
          {allergies.length > 0 && (
            <span>
              {t("：")}
              {t(allergies.map(allergenLabel).join("・"))}
            </span>
          )}
        </p>
        <Link
          to={
            personal
              ? "/profile"
              : group
                ? `/groups/${group.id}`
                : "/groups/new"
          }
        >
          {t("食の好みを確認")}
        </Link>
      </div>
      <div className="cuisine-row">
        <button
          className={!cuisine ? "active" : ""}
          onClick={() => setCuisine("")}
        >
          <Utensils size={25} />
          <span>{t("すべて")}</span>
        </button>
        {CUISINES.map((c, i) => {
          const Icon = cuisineIcons[i];
          return (
            <button
              key={c}
              className={cuisine === c ? "active" : ""}
              onClick={() => setCuisine(c)}
            >
              <Icon size={25} />
              <span>{t(c)}</span>
            </button>
          );
        })}
      </div>
      <section className="results-section">
        <div className="section-heading">
          <div>
            <h2>
              {t(
                personal ? "あなたにおすすめのお店" : "みんなにおすすめのお店",
              )}
              <span className="result-count">
                {matches.length}
                {t("件")}
              </span>
            </h2>
            <p>
              {t(appliedArea || "すべてのエリア")}
              {t("·")}
              {t(budgetLabel(appliedRange))}
              {t(" · 登録されたアレルギー条件に一致")}
            </p>
          </div>
          <span className="sort-label">
            <SlidersHorizontal size={16} />
            {t("おすすめ度順")}
          </span>
        </div>
        {searched && (
          <div className="sr-only" role="status">
            {t("検索が完了しました。おすすめは")}
            {matches.length}
            {t("件です。")}
          </div>
        )}
        {matches.length > 0 ? (
          <div className="restaurant-grid">
            {matches.map((m, i) => (
              <RestaurantCard
                match={m}
                rank={i}
                groupId={!personal ? group?.id : undefined}
                onSelect={() => choose(m.restaurant.id)}
                key={m.restaurant.id}
              />
            ))}
          </div>
        ) : (
          <Empty title={t("条件に一致するお店がありません")}>
            <p>
              {t(
                "アレルギー条件は緩和せず、エリアや予算、ジャンルを変更して探してください。",
              )}
            </p>
            {!members.length && (
              <Link to="/groups/new" className="text-link">
                {t("グループを作成")}
              </Link>
            )}
          </Empty>
        )}
      </section>
      {result.excluded.length > 0 && (
        <details className="excluded-section">
          <summary>
            <span>
              <ShieldCheck size={20} />
              <strong>{t("候補から除外したお店")}</strong>
              <span className="tag neutral">
                {result.excluded.length}
                {t("件")}
              </span>
            </span>
            <ChevronDown size={19} />
          </summary>
          <p className="muted small">
            {t(
              "使用あり・未確認のアレルゲンは、メニューや好みの点数に関係なく候補から除外します。",
            )}
          </p>
          <div className="excluded-grid">
            {result.excluded.map(({ restaurant: r, reasons }) => (
              <div key={r.id}>
                <Link
                  to={`/restaurants/${r.id}${!personal && group ? `?group=${group.id}` : ""}`}
                >
                  <strong>{r.name}</strong>
                </Link>
                <AllergyImpact restaurant={r} members={members} />
                {reasons.map((reason) => (
                  <p key={reason}>{t(reason)}</p>
                ))}
                {group && (
                  <ForceDecideButton
                    name={r.name}
                    reasons={reasons}
                    onConfirm={() => choose(r.id, true)}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="small muted">
            {t(
              "割合は全メニューのうち、参加者の登録アレルギーに該当する確認済みメニューの品数です。複数のアレルギーに該当しても1品として数えます。未確認のメニューは分母に含み、該当数には含めません。店舗全体の使用状況による除外は維持します。",
            )}
          </p>
        </details>
      )}
      <div className="bottom-links">
        <Link to="/groups/new">
          <Plus size={17} />
          {t("新しいグループを作る")}
        </Link>
        <Link to="/restaurants/new">{t("飲食店の方へ · 店舗を登録する")}</Link>
      </div>
      <Notice compact />
    </>
  );
}
