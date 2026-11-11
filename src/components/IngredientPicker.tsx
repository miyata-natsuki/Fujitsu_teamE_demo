import { useLocale } from "../hooks/useLocale";
import { useId, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Tags, SelectionActions } from "./ui";
import { foodSearchMatch } from "../lib/foodInput";
export function IngredientPicker({
  options,
  selected,
  onChange,
  label,
  tone = "coral",
  allowSelectAll = false,
  allowCustom = false,
}: {
  options: readonly (string | readonly [string, string])[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
  tone?: string;
  allowSelectAll?: boolean;
  /** 候補にない食材を自由記述で追加できる */
  allowCustom?: boolean;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const id = useId();
  const entries = options.map((o) => (typeof o === "string" ? [o, o] : [...o]));
  const typed = query.trim();
  const hasExact = entries.some(([value, text]) => value === typed || text === typed);
  const canAddCustom = allowCustom && !!typed && !hasExact && !selected.includes(typed);
  const addTyped = () => {
    if (!typed) return;
    const exact = entries.find(([value, text]) => value === typed || text === typed);
    const value = exact ? exact[0] : allowCustom ? typed : null;
    if (value === null || selected.includes(value)) return;
    onChange([...selected, value]);
    setQuery("");
  };
  const filtered = entries.filter(
    ([value, text]) =>
      !selected.includes(value) && foodSearchMatch(value, text, query),
  );
  return (
    <div className="ingredient-picker">
      {allowSelectAll && (
        <>
          <SelectionActions
            options={entries.map(([value]) => value)}
            selected={selected}
            onChange={onChange}
            label={t(label)}
          />
          <p className="small muted">
            {t(
              "全選択は、検索条件に関係なくすべての食材を選びます。同じ食材の苦手登録は解除されます。",
            )}
          </p>
        </>
      )}
      <label className="ingredient-search" htmlFor={id}>
        <Search size={18} />
        <input
          aria-label={t(`${label}を検索`)}
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enterでフォーム全体が送信されないようにし、入力中の食材を追加する
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              addTyped();
            }
          }}
          maxLength={allowCustom ? 30 : undefined}
          placeholder={t(
            allowCustom
              ? "検索、または自由に入力して追加"
              : `${label}を検索（例：えび、たまご）`,
          )}
          autoComplete="off"
        />
      </label>
      {canAddCustom && (
        <button type="button" className="button secondary" onClick={addTyped}>
          <Plus size={16} />
          {t("自由記述で追加：")}
          {typed}
        </button>
      )}
      <div className="selected-ingredients" aria-live="polite">
        {selected.length ? (
          selected.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => onChange(selected.filter((v) => v !== value))}
              aria-label={t(
                `${entries.find((e) => e[0] === value)?.[1] ?? value}を解除`,
              )}
            >
              {t(entries.find((e) => e[0] === value)?.[1] ?? value)}
              <X size={14} />
            </button>
          ))
        ) : (
          <span className="small muted">
            {t("未選択 · 下の候補から追加できます")}
          </span>
        )}
      </div>
      <Tags
        options={filtered.map(([a, b]) => [a, b] as const)}
        selected={[]}
        onChange={(v) => onChange([...selected, ...v])}
        tone={tone}
      />
      {!filtered.length && (
        <p className="small muted">
          {t(
            entries.every(([value]) => selected.includes(value))
              ? "すべての食材を選択しています。"
              : "該当する未選択の食材がありません。検索語を変えてください。",
          )}
        </p>
      )}
    </div>
  );
}
