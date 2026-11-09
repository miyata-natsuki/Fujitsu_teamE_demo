import { useLocale } from "../hooks/useLocale";
import {
  AlertTriangle,
  Check,
  Utensils,
  X,
  Star,
  Salad,
  Leaf,
  EggOff,
  WheatOff,
  MoonStar,
  ChefHat,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { useEffect, useRef, type ReactNode } from "react";
import type { RestaurantMatch, Restaurant, MenuItem } from "../types";
import {
  ALLERGENS,
  allergenLabel,
  STATUS_LABELS,
  SAFETY_NOTICE,
  AVAILABILITY_LABELS,
  ACCOMMODATION_ITEMS,
  badgeLabel,
} from "../data/constants";
export const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;
const BADGE_STYLES: Record<string, { Icon: LucideIcon; bg: string; fg: string }> =
  {
    vegetarian: { Icon: Salad, bg: "#e2f4d6", fg: "#1f6b34" },
    vegan: { Icon: Leaf, bg: "#d6f0ea", fg: "#18795f" },
    removal: { Icon: EggOff, bg: "#fcefcb", fg: "#7a4a1d" },
    gluten_free: { Icon: WheatOff, bg: "#d9e9fb", fg: "#1f4f8f" },
    halal: { Icon: MoonStar, bg: "#e6e0f7", fg: "#2f7d56" },
    kids_allergy: { Icon: ChefHat, bg: "#fbe0e6", fg: "#9b2c4a" },
  };
/** 丸いバッジ。checked=false のときはグレーで表示する（店舗の選択画面用）。 */
export function BadgeIcon({
  id,
  size = "md",
  checked = true,
}: {
  id: string;
  size?: "sm" | "md";
  checked?: boolean;
}) {
  const { t } = useLocale();
  const style = BADGE_STYLES[id] ?? BADGE_STYLES.kids_allergy;
  return (
    <span
      className={`badge-circle ${size} ${checked ? "" : "off"}`}
      style={{ background: style.bg, color: style.fg }}
    >
      <style.Icon size={size === "sm" ? 22 : 34} aria-hidden="true" />
      <span className="badge-label">{t(badgeLabel(id))}</span>
      {checked && (
        <span className="badge-check" aria-hidden="true">
          <Check size={size === "sm" ? 11 : 15} strokeWidth={3} />
        </span>
      )}
    </span>
  );
}
export function BadgeList({
  restaurant,
  size = "sm",
}: {
  restaurant: Restaurant;
  size?: "sm" | "md";
}) {
  if (!restaurant.badges?.length) return null;
  return (
    <div className="badge-row">
      {restaurant.badges.map((id) => (
        <BadgeIcon id={id} size={size} key={id} />
      ))}
    </div>
  );
}
/** 店舗がチェックを付けて選ぶ、丸いバッジの選択UI。 */
export function BadgePicker({
  options,
  selected,
  onChange,
}: {
  options: readonly (readonly [string, string])[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="badge-row">
      {options.map(([id]) => {
        const on = selected.includes(id);
        return (
          <button
            type="button"
            className="badge-button"
            key={id}
            aria-pressed={on}
            onClick={() =>
              onChange(on ? selected.filter((v) => v !== id) : [...selected, id])
            }
          >
            <BadgeIcon id={id} size="md" checked={on} />
          </button>
        );
      })}
    </div>
  );
}/** メニューごとの対応範囲（食材を抜く、器具を分ける等）。未設定は「未確認」。 */
export function MenuAccommodations({ menu }: { menu: MenuItem }) {
  const { t } = useLocale();
  const a = menu.accommodations;
  return (
    <div className="contact-note">
      <strong>{t("アレルギーへの対応範囲")}</strong>
      <ul className="plain-list">
        {ACCOMMODATION_ITEMS.map(([key, label]) => (
          <li key={key}>
            {t(label)}：{t(AVAILABILITY_LABELS[a?.[key] ?? "unknown"])}
          </li>
        ))}
      </ul>
      {a && a.removeIngredients !== "impossible" && a.removeIngredients !== "unknown" && (
        <p className="small">
          {t("抜ける食材：")}
          {a.removableIngredients?.length
            ? a.removableIngredients.map((i) => t(i)).join("・")
            : t("店舗へご確認ください")}
        </p>
      )}
      {a?.note && <p className="small">{a.note}</p>}
      <p className="small muted">
        {t("対応内容は予約前に店舗へ直接ご確認ください。")}
      </p>
    </div>
  );
}
export function FoodImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <img
      src={src}
      alt={t(alt)}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `${import.meta.env.BASE_URL}images/fallback.svg`;
      }}
    />
  );
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const { t } = useLocale();
  return (
    <span className={`avatar avatar-${index % 4}`} aria-label={name}>
      {name.slice(0, 1)}
    </span>
  );
}
export function Notice({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <div className={`notice ${compact ? "compact" : ""}`}>
      <AlertTriangle size={17} />
      <p>{t(SAFETY_NOTICE)}</p>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="empty">
      <span className="empty-icon">
        <Utensils size={30} />
      </span>
      <h2>{t(title)}</h2>
      <div className="muted">{t(children)}</div>
      <Link to="/" className="button secondary">
        {t("ホームへ")}
      </Link>
    </div>
  );
}
export function Tags({
  options,
  selected,
  onChange,
  tone = "coral",
}: {
  options: readonly (string | readonly [string, string])[];
  selected: string[];
  onChange: (values: string[]) => void;
  tone?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="tags">
      {options.map((option) => {
        const [id, label] =
          typeof option === "string" ? [option, option] : option;
        const active = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            className={`tag selectable ${active ? `selected ${tone}` : ""}`}
            aria-pressed={active}
            onClick={() =>
              onChange(
                active ? selected.filter((v) => v !== id) : [...selected, id],
              )
            }
          >
            {active && <Check size={13} />}
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}
export function SelectionActions({
  options,
  selected,
  onChange,
  label,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const { t } = useLocale();
  const count = options.filter((value) => selected.includes(value)).length;
  return (
    <div className="selection-actions">
      <button
        type="button"
        className="text-link small"
        aria-label={t(`${label}を全選択`)}
        disabled={count === options.length}
        onClick={() => onChange([...new Set([...selected, ...options])])}
      >
        {t("全選択")}
      </button>
      <button
        type="button"
        className="text-link small"
        aria-label={t(`${label}の選択をすべて解除`)}
        disabled={!selected.length}
        onClick={() => onChange([])}
      >
        {t("すべて解除")}
      </button>
      <span className="small muted" role="status">
        {count}
        {t("/")}
        {options.length}
        {t("選択中")}
      </span>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...document.querySelectorAll("header, main, footer")];
    background.forEach((el) => el.setAttribute("inert", ""));
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const targets = [
        ...(ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select, textarea, [tabindex="0"]',
        ) ?? []),
      ].filter((el) => el.getClientRects().length > 0);
      const first = targets[0],
        last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      background.forEach((el) => el.removeAttribute("inert"));
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-title">
          <h2>{t(title)}</h2>
          <button
            className="icon-button"
            aria-label={t("閉じる")}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        {t(children)}
      </section>
    </div>,
    document.body,
  );
}
export function AllergenPanel({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLocale();
  return (
    <div className="allergen-panel">
      {(["used", "not_used", "unknown"] as const).map((status) => (
        <div key={status}>
          <h4>
            <span className={`status-symbol ${status}`}>
              {t(
                status === "not_used" ? (
                  <Check size={14} />
                ) : status === "unknown" ? (
                  "?"
                ) : (
                  "!"
                ),
              )}
            </span>
            {t(STATUS_LABELS[status])}
          </h4>
          <div className="tags">
            {ALLERGENS.filter(
              ([id]) =>
                (restaurant.allergenStatuses[id] ?? "unknown") === status,
            ).map(([id, name]) => (
              <span className={`tag ${status}`} key={id}>
                {t(name)}
              </span>
            ))}
            {!ALLERGENS.some(
              ([id]) =>
                (restaurant.allergenStatuses[id] ?? "unknown") === status,
            ) && <span className="muted small">{t("該当なし")}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
export function Recommendations({ match }: { match: RestaurantMatch }) {
  const { t } = useLocale();
  return (
    <div className="recommendation-list">
      {match.recommendations.map((rec, i) => (
        <div className="recommendation" key={rec.member.id}>
          <Avatar name={rec.member.nickname} index={i} />
          <div>
            <strong>
              {rec.member.nickname}
              <span className="muted small">{t("さん")}</span>
            </strong>
            <p>{t(rec.menu.name)}</p>
            <span className="muted small">{t(rec.reasons.join(" / "))}</span>
          </div>
          <div className="member-score">
            <strong>
              {rec.score}
              <small>{t("%")}</small>
            </strong>
            <span>{t("満足度")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
/** 全メニューのうち全員に安全なメニューの数と、使用あり・未確認などの注意点。 */
export function MatchSafety({ match }: { match: RestaurantMatch }) {
  const { t } = useLocale();
  return (
    <div className="match-safety">
      <p className="small">
        {t("全メニュー")}
        {match.totalMenus}
        {t("品中")}
        <strong>{match.safeMenus}</strong>
        {t("品が、全員のアレルゲンを含まない確認済みメニューです")}
      </p>
      {match.warnings.length > 0 ? (
        <details>
          <summary className="small">
            <AlertTriangle size={13} />
            {t("要確認")} {match.warnings.length}
            {t("件")}
          </summary>
          {match.warnings.map((w) => (
            <p className="small" key={w}>
              {t(w)}
            </p>
          ))}
        </details>
      ) : (
        <p className="small green-text">
          <Check size={13} />
          {t("店舗全体のアレルゲン：全員分が不使用確認済み")}
        </p>
      )}
    </div>
  );
}
export function RestaurantCard({
  match,
  rank,
  groupId,
  onSelect,
  decide,
}: {
  match: RestaurantMatch;
  rank: number;
  groupId?: string;
  onSelect?: () => void;
  /** 注意点があるお店で、確認ダイアログ付きの決定ボタンに差し替える */
  decide?: ReactNode;
}) {
  const { t } = useLocale();
  const { restaurant: r } = match;
  return (
    <article className="restaurant-card">
      <Link
        to={`/restaurants/${r.id}${groupId ? `?group=${groupId}` : "?personal=1"}`}
        className="card-image-link"
      >
        <FoodImage src={r.images[0]} alt={t(`${r.name}の料理（イメージ）`)} />
        <span className={`card-label ${rank === 0 ? "top" : ""}`}>
          <Check size={13} />
          {t(
            match.warnings.length > 0
              ? "アレルギー情報に要確認あり"
              : rank === 0
                ? groupId
                  ? "みんなに一番おすすめ"
                  : "あなたに一番おすすめ"
                : "アレルギー登録条件に一致",
          )}
        </span>
        <span className="image-count">
          {t("1 /")}
          {r.images.length}
        </span>
      </Link>
      <div className="card-body">
        <div className="card-heading">
          <Link
            to={`/restaurants/${r.id}${groupId ? `?group=${groupId}` : "?personal=1"}`}
          >
            <h3>{r.name}</h3>
          </Link>
          <span className="rating">
            {t(
              r.reviews.length > 0 ? (
                <>
                  <Star size={13} fill="currentColor" />
                  {t(r.rating.toFixed(1))}
                </>
              ) : (
                "新規登録"
              ),
            )}
          </span>
        </div>
        <p className="card-meta">
          {t(r.area)}
          {t("·")}
          {t(r.cuisine)}
        </p>
        <BadgeList restaurant={r} />
        {match.requested.total > 0 && (
          <p className="small muted">
            {t("指定した条件との一致")}：{match.requested.matched}/
            {match.requested.total}
          </p>
        )}
        <div className="card-score">
          <span>
            {t(groupId ? "みんなの" : "あなたの")}
            {t("マッチ度")}
          </span>
          <strong>
            {match.score}
            <small>{t("%")}</small>
          </strong>
        </div>
        <div className="score-track">
          <span style={{ width: `${match.score}%` }} />
        </div>
        <MatchSafety match={match} />
        <p className="card-reason">
          {t(
            match.recommendations.filter((rec) =>
              rec.reasons.some((reason) => reason.startsWith("好き")),
            ).length > 0
              ? `${match.recommendations.filter((rec) => rec.reasons.some((reason) => reason.startsWith("好き"))).length}人の「好き」が見つかるお店`
              : "登録された食の好みで比較しています",
          )}
        </p>
        <div className="card-price">
          <span>
            <strong>{t(yen(r.price))}</strong>
            <small>{t("/ 人（目安）")}</small>
          </span>
          <details>
            <summary>{t("おすすめメニュー")}</summary>
            <div className="card-recs">
              {match.recommendations.map((rec) => (
                <p key={rec.member.id}>
                  <b>
                    {rec.member.nickname} {rec.score}
                    {t("%")}
                  </b>
                  <span>{t(rec.menu.name)}</span>
                </p>
              ))}
            </div>
          </details>
        </div>
        {groupId &&
          (decide ?? (
            <button className="card-decide" onClick={onSelect}>
              {t("このお店に決定")}
            </button>
          ))}
      </div>
    </article>
  );
}
export function ProfileSummary({
  values,
  allergies = false,
}: {
  values: string[];
  allergies?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="tags">
      {values.length ? (
        values.map((v) => (
          <span className={`tag ${allergies ? "used" : "neutral"}`} key={v}>
            {t(allergies ? allergenLabel(v) : v)}
          </span>
        ))
      ) : (
        <span className="muted small">{t("登録なし")}</span>
      )}
    </div>
  );
}
