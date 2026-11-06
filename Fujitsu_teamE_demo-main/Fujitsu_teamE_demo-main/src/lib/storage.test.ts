import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialData } from "../data/seed";
import { loadData, saveData, STORAGE_KEY } from "./storage";
const values = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
});
beforeEach(() => values.clear());
describe("local demo persistence", () => {
  it("seeds on first use and retains changes across reads", () => {
    const d = loadData();
    expect(d.restaurants).toHaveLength(20);
    d.groups[0].name = "保存されたグループ";
    saveData(d);
    expect(loadData().groups[0].name).toBe("保存されたグループ");
  });
  it("supports new guests, stores, store edits and decisions", () => {
    let d = createInitialData();
    d.groups[0].members.push({
      ...d.profile,
      id: "guest",
      nickname: "新ゲスト",
    });
    d.groups[0].selectedRestaurantId = "r1";
    d.restaurants.push({ ...d.restaurants[0], id: "new", name: "新店" });
    d.restaurants[0].allergenStatuses.egg = "unknown";
    saveData(d);
    d = loadData();
    expect(d.groups[0].members).toHaveLength(5);
    expect(d.groups[0].selectedRestaurantId).toBe("r1");
    expect(d.restaurants).toHaveLength(21);
    expect(d.restaurants[0].allergenStatuses.egg).toBe("unknown");
  });
  it("rejects malformed data without overwriting it", () => {
    values.set(STORAGE_KEY, "broken");
    expect(() => loadData()).toThrow();
    expect(values.get(STORAGE_KEY)).toBe("broken");
    values.set(STORAGE_KEY, JSON.stringify({ version: 1 }));
    expect(() => loadData()).toThrow();
  });
  it("resets by saving fresh initial data", () => {
    const d = loadData();
    d.restaurants = [];
    saveData(d);
    saveData(createInitialData());
    expect(loadData().restaurants).toHaveLength(20);
  });
});
