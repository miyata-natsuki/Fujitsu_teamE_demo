import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Languages } from "lucide-react";
import { translate } from "../lib/translate";
import { LANGUAGE_KEY, isLocale, type Locale } from "../lib/translations";
interface LocaleContextValue {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: <T>(value: T) => T;
}
const Context = createContext<LocaleContextValue | null>(null);
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return isLocale(saved) ? saved : "ja";
    } catch {
      return "ja";
    }
  });
  const setLocale = (value: Locale) => {
    setLanguage(value);
    try {
      localStorage.setItem(LANGUAGE_KEY, value);
    } catch {
      /* Keep switching available when browser storage is disabled. */
    }
  };
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : locale;
    document.title =
      locale === "ja"
        ? "mogu — おいしい時間を、みんなで。"
        : locale === "en"
          ? "mogu — Good food, together."
          : locale === "zh"
            ? "mogu — 一起享受美食。"
            : "mogu — 함께, 맛있게.";
  }, [locale]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === LANGUAGE_KEY && isLocale(e.newValue))
        setLanguage(e.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const t = useMemo(() => {
    function localize<T>(value: T): T {
      if (typeof value === "string") return translate(value, locale) as T;
      if (Array.isArray(value)) return value.map(localize) as T;
      return value;
    }
    return localize;
  }, [locale]);
  return (
    <Context.Provider value={{ locale, setLocale, t }}>
      {children}
    </Context.Provider>
  );
}
export function useLocale() {
  const value = useContext(Context);
  if (!value) throw new Error("LocaleProvider is required");
  return value;
}
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className="language-switcher">
      <Languages size={17} aria-hidden="true" />
      <span className="sr-only">{t("言語")}</span>
      <select
        aria-label={t("言語")}
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
      >
        <option value="ja">日本語</option>
        <option value="en">English</option>
        <option value="zh">简体中文</option>
        <option value="ko">한국어</option>
      </select>
    </label>
  );
}
