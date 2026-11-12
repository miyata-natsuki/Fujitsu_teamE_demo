import { useState } from "react";
import { useLocale } from "../hooks/useLocale";
import { useStore } from "../hooks/useStore";
import { allergenLabel } from "../data/constants";
import type { Group, Restaurant } from "../types";
/** 決定したお店のデモ予約。店舗への実際の連絡は行わず、ブラウザ内に保存するだけ。 */
export function ReservationSection({
  group,
  restaurant,
}: {
  group: Group;
  restaurant: Restaurant;
}) {
  const { t } = useLocale();
  const { update } = useStore();
  const saved =
    group.reservation?.restaurantId === restaurant.id
      ? group.reservation
      : undefined;
  const [editing, setEditing] = useState(!saved);
  const [date, setDate] = useState(saved?.date ?? "");
  const [time, setTime] = useState(saved?.time ?? "18:00");
  const [people, setPeople] = useState(saved?.people ?? group.members.length);
  const [name, setName] = useState(saved?.name ?? "");
  const [note, setNote] = useState(saved?.note ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const save = () => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) =>
        g.id === group.id
          ? {
              ...g,
              reservation: {
                restaurantId: restaurant.id,
                date,
                time,
                people,
                name: name.trim(),
                note: note.trim(),
              },
            }
          : g,
      ),
    }));
    setEditing(false);
  };
  const cancel = () => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) =>
        g.id === group.id ? { ...g, reservation: undefined } : g,
      ),
    }));
    setEditing(true);
  };
  return (
    <section className="form-card">
      <h2>{t("予約する")}</h2>
      <div className="contact-note">
        <strong>{t("お店に伝えるアレルギー情報")}</strong>
        <ul>
          {group.members.map((m) => (
            <li key={m.id}>
              {m.nickname}：
              {m.allergies.length
                ? m.allergies.map((a) => t(allergenLabel(a))).join("・")
                : t("登録なし")}
              {m.allergyNote?.trim() && (
                <span className="small muted"> — {m.allergyNote.trim()}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {saved && !editing ? (
        <>
          <p>
            <strong>
              {saved.date} {saved.time}
            </strong>
            {" · "}
            {saved.people}
            {t("人")}
            {" · "}
            {saved.name}
            {t("様")}
          </p>
          {saved.note && <p className="small">{saved.note}</p>}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(true)}
            >
              {t("予約内容を変更")}
            </button>
            <button type="button" className="button secondary" onClick={cancel}>
              {t("予約を取り消す")}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="form-grid">
            <label className="field">
              {t("日付")}
              <input
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              {t("時間")}
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <label className="field">
              {t("人数")}
              <input
                type="number"
                required
                min={1}
                max={30}
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
              />
            </label>
            <label className="field">
              {t("予約者名（ニックネーム可）")}
              <input
                required
                maxLength={40}
                pattern={".*\\S.*"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            {t("店舗への依頼・要望（食材を抜く、器具を分ける等）")}
            <textarea
              rows={3}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="form-actions">
            {saved && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(false)}
              >
                {t("やめる")}
              </button>
            )}
            <button className="button primary">{t("予約を確定する")}</button>
          </div>
        </form>
      )}
      <p className="small muted">
        {t(
          "デモのため、予約内容はこのブラウザ内に保存されるだけで、店舗へは送信されません。",
        )}
      </p>
    </section>
  );
}
