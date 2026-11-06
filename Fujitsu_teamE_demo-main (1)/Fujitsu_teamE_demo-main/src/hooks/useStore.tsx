import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppData } from "../types";
import { createInitialData } from "../data/seed";
import { loadData, saveData, STORAGE_KEY } from "../lib/storage";
interface Store {
  data: AppData;
  error: string;
  update: (fn: (latest: AppData) => AppData) => boolean;
  reset: () => boolean;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState("");
  const [data, setData] = useState<AppData>(() => {
    try {
      return loadData();
    } catch {
      return createInitialData();
    }
  });
  useEffect(() => {
    try {
      setData(loadData());
    } catch {
      setError("保存データを読み込めません。データのリセットが必要です。");
    }
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setData(loadData());
          setError("");
        } catch {
          setError("別タブの保存データを読み込めません。");
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const update = (fn: (latest: AppData) => AppData) => {
    try {
      const next = fn(loadData());
      saveData(next);
      setData(next);
      setError("");
      return true;
    } catch {
      setError(
        "保存できませんでした。ブラウザの保存設定・空き容量をご確認ください。",
      );
      return false;
    }
  };
  const reset = () => {
    try {
      const next = createInitialData();
      saveData(next);
      setData(next);
      setError("");
      return true;
    } catch {
      setError("リセットできません。ブラウザの保存設定をご確認ください。");
      return false;
    }
  };
  return (
    <Context.Provider value={{ data, error, update, reset }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is required");
  return store;
}
