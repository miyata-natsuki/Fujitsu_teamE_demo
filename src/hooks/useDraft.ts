import { useEffect, useState } from "react";
const PREFIX = "mogu-draft-v1:";
// 保存・破棄の直後に、下書きが書き戻されないようにするための印
const suspended = new Set<string>();
const storageKey = (base: string, name: string) => `${PREFIX}${base}|${name}`;
/** 入力途中の内容を保存する useState。登録が完了するまで、画面を離れても残る。 */
export function useDraftState<T>(base: string, name: string, init: () => T) {
  const key = storageKey(base, name);
  const [value, setValue] = useState<T>(() => {
    suspended.delete(base);
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // 読み込めない場合は初期値から始める
    }
    return init();
  });
  useEffect(() => {
    if (suspended.has(base)) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 容量不足などで保存できなくても、入力そのものは続けられる
    }
  }, [base, key, value]);
  return [value, setValue] as const;
}
/** 下書きを削除する（登録の完了時・破棄時）。以降は resumeDraft まで書き戻さない。 */
export function clearDraft(base: string) {
  suspended.add(base);
  try {
    const prefix = `${PREFIX}${base}|`;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // 何もしない
  }
}
/** 破棄した後も同じ画面で入力を続けるときに、下書きの保存を再開する。 */
export function resumeDraft(base: string) {
  suspended.delete(base);
}
