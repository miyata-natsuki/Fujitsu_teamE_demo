import { useId, useState } from "react";
import { useLocale } from "../hooks/useLocale";
/**
 * エリア入力。押すと「すべてのエリア」と検索履歴が候補に出る。
 * エリア名（渋谷）や、エリア名＋駅名（渋谷 神泉駅）を自由に入力して検索できる。
 * value が空文字のときは「すべてのエリア」。
 */
export function AreaCombobox({
  value,
  onChange,
  history,
}: {
  value: string;
  onChange: (value: string) => void;
  history: string[];
}) {
  const { t } = useLocale();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  const query = typed ? value.trim() : "";
  const items = [
    "",
    ...history.filter((h) => !query || h.includes(query)),
  ];
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setTyped(false);
    setActive(-1);
  };
  return (
    <div className="area-combobox">
      <input
        role="combobox"
        aria-label={t("エリア")}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        maxLength={40}
        value={open || value ? value : t("すべてのエリア")}
        placeholder={t("すべてのエリア")}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setOpen(false);
          setTyped(false);
          setActive(-1);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setTyped(true);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Enter" && open && active >= 0) {
            // 候補を選ぶ。選んでいないときは、そのままフォームが送信される。
            e.preventDefault();
            choose(items[active]);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="area-options"
          onMouseDown={(e) => e.preventDefault()}
        >
          {items.map((item, i) => (
            <li
              key={item || "__all"}
              role="option"
              aria-selected={item === value}
              className={i === active ? "active" : ""}
              onClick={() => choose(item)}
            >
              {item ? item : t("すべてのエリア")}
              {item && <small>{t("履歴")}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
const HISTORY_KEY = "mogu-area-history";
export function loadAreaHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function saveAreaHistory(area: string): string[] {
  const text = area.trim();
  const current = loadAreaHistory();
  if (!text) return current;
  const next = [text, ...current.filter((h) => h !== text)].slice(0, 8);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // 保存できない環境では履歴を残さない
  }
  return next;
}
