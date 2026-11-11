import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, History, X } from "lucide-react";
import { useLocale } from "../hooks/useLocale";
import { LOCATIONS } from "../data/constants";
import {
  areaSelectionLabel,
  isEmptyArea,
  type AreaSelection,
} from "../lib/areaSelection";
const LEVELS = ["県", "市（区）", "駅"] as const;
/**
 * エリアを選ぶパネル（検索画面の上に重ねて開く）。
 * 県 → 市（区） → 駅の順に選び、途中で止めても、選んだところまでが検索条件になる。
 */
export function AreaPanel({
  value,
  history,
  onApply,
  onClose,
}: {
  value: AreaSelection;
  history: AreaSelection[];
  onApply: (selection: AreaSelection) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [sel, setSel] = useState<AreaSelection>(value);
  // 0: 県 / 1: 市 / 2: 駅（すでに選択があれば、次に選ぶ段階から始める）
  const [level, setLevel] = useState(
    value.city ? 2 : value.prefecture ? 1 : 0,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const prefecture = LOCATIONS.find((l) => l.prefecture === sel.prefecture);
  const city = prefecture?.cities.find((c) => c.name === sel.city);
  const items: string[] =
    level === 0
      ? LOCATIONS.map((l) => l.prefecture)
      : level === 1
        ? (prefecture?.cities.map((c) => c.name) ?? [])
        : (city?.stations ?? []);
  const current = [sel.prefecture, sel.city, sel.station][level];
  const pick = (name: string) => {
    if (level === 0) {
      setSel(sel.prefecture === name ? sel : { prefecture: name });
      setLevel(1);
    } else if (level === 1) {
      setSel(sel.city === name ? sel : { prefecture: sel.prefecture, city: name });
      setLevel(2);
    } else {
      setSel({ ...sel, station: sel.station === name ? undefined : name });
    }
  };
  const crumbs = [sel.prefecture, sel.city, sel.station];
  return (
    <div className="area-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="area-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("エリアを選ぶ")}
        tabIndex={-1}
        ref={panelRef}
      >
        <header>
          <h2>{t("エリアを選ぶ")}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label={t("閉じる")}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <p className="muted small">
          {t(
            "県 → 市（区） → 駅の順に選べます。途中まででも、選んだところまでで検索します。",
          )}
        </p>
        {history.length > 0 && (
          <section className="area-history">
            <h3>
              <History size={15} />
              {t("最近の検索")}
            </h3>
            <div className="tags">
              {history.map((h) => (
                <button
                  type="button"
                  className="tag neutral"
                  key={areaSelectionLabel(h)}
                  onClick={() => onApply(h)}
                >
                  {areaSelectionLabel(h)}
                </button>
              ))}
            </div>
          </section>
        )}
        <nav className="area-crumbs" aria-label={t("選択中のエリア")}>
          <button
            type="button"
            className={level === 0 ? "active" : ""}
            onClick={() => setLevel(0)}
          >
            {t("県")}
            <b>{sel.prefecture ? t(sel.prefecture) : t("指定しない")}</b>
          </button>
          <ChevronRight size={16} />
          <button
            type="button"
            className={level === 1 ? "active" : ""}
            disabled={!sel.prefecture}
            onClick={() => setLevel(1)}
          >
            {t("市（区）")}
            <b>{sel.city ? t(sel.city) : t("指定しない")}</b>
          </button>
          <ChevronRight size={16} />
          <button
            type="button"
            className={level === 2 ? "active" : ""}
            disabled={!sel.city}
            onClick={() => setLevel(2)}
          >
            {t("駅")}
            <b>{sel.station ? t(sel.station) : t("指定しない")}</b>
          </button>
        </nav>
        <h3 className="area-level-title">
          {t(`${LEVELS[level]}を選ぶ`)}
          {crumbs[level] && (
            <small>{t("（もう一度押すと選択を変更できます）")}</small>
          )}
        </h3>
        <ul className="area-list">
          {items.map((name) => (
            <li key={name}>
              <button
                type="button"
                className={name === current ? "selected" : ""}
                aria-pressed={name === current}
                onClick={() => pick(name)}
              >
                <span>{t(name)}</span>
                {name === current ? (
                  <Check size={17} />
                ) : level < 2 ? (
                  <ChevronRight size={17} />
                ) : null}
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="muted small">{t("先に上の段階を選んでください。")}</li>
          )}
        </ul>
        <footer>
          <button
            type="button"
            className="button secondary"
            disabled={level === 0}
            onClick={() => setLevel(level - 1)}
          >
            <ChevronLeft size={16} />
            {t("戻る")}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => onApply({})}
          >
            {t("すべてのエリアで検索")}
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => onApply(sel)}
          >
            {isEmptyArea(sel)
              ? t("この条件で検索")
              : `${areaSelectionLabel(sel)} ${t("で検索")}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
