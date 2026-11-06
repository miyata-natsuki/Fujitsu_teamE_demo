import { useLocale } from "../hooks/useLocale";
import { useState } from "react";
import { ShieldCheck, Leaf, Check } from "lucide-react";
import type { UserProfile } from "../types";
import { ALLERGENS, INGREDIENTS, CUISINES } from "../data/constants";
import { Tags, SelectionActions } from "./ui";
import { IngredientPicker } from "./IngredientPicker";
export const blankProfile = (): UserProfile => ({
  id: crypto.randomUUID(),
  nickname: "",
  allergies: [],
  likedIngredients: [],
  dislikedIngredients: [],
  likedCuisines: [],
  dislikedCuisines: [],
});
export function ProfileForm({
  initial,
  onSave,
  submitLabel = "プロフィールを保存",
}: {
  initial?: UserProfile;
  onSave: (profile: UserProfile) => void;
  submitLabel?: string;
}) {
  const { t } = useLocale();
  const [profile, setProfile] = useState<UserProfile>(
    initial ? structuredClone(initial) : blankProfile,
  );
  const [step, setStep] = useState(0);
  const set = (key: keyof UserProfile, value: string[]) =>
    setProfile((p) => {
      const next = { ...p, [key]: value };
      const opposite = {
        likedIngredients: "dislikedIngredients",
        dislikedIngredients: "likedIngredients",
        likedCuisines: "dislikedCuisines",
        dislikedCuisines: "likedCuisines",
      } as const;
      if (key in opposite) {
        const other = opposite[key as keyof typeof opposite];
        next[other] = next[other].filter((v) => !value.includes(v));
      }
      return next;
    });
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 0) setStep(1);
        else onSave({ ...profile, nickname: profile.nickname.trim() });
      }}
    >
      <div className="mini-steps">
        <span className={step === 0 ? "active" : ""}>
          <ShieldCheck size={16} />
          {t("1. アレルギー")}
        </span>
        <span className={step === 1 ? "active" : ""}>
          <Leaf size={16} />
          {t("2. 食の好み")}
        </span>
      </div>
      {step === 0 ? (
        <>
          <label className="field">
            {t("ニックネーム")}
            <input
              autoFocus
              required
              maxLength={24}
              value={profile.nickname}
              placeholder={t("例：あかり")}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nickname: e.target.value }))
              }
              pattern={".*\\S.*"}
            />
          </label>
          <section className="form-section">
            <h3>
              <ShieldCheck size={20} />
              {t("アレルギー")}
            </h3>
            <p>
              {t(
                "該当するものをすべて選んでください。好き嫌いとは別に、お店を絞り込む必須条件として使います。",
              )}
            </p>
            <IngredientPicker
              label={t("アレルギー食材")}
              options={ALLERGENS}
              selected={profile.allergies}
              onChange={(v) => set("allergies", v)}
            />
            <p className="small muted">
              {t("選択なしは「登録なし」として扱います。")}
            </p>
          </section>
          <div className="notice compact">
            {t(
              "デモ用の架空プロフィールを入力してください。実際の個人情報・医療情報は登録しないでください。",
            )}
          </div>
        </>
      ) : (
        <>
          <section className="form-section">
            <h3>{t("好きな食材")}</h3>
            <IngredientPicker
              label={t("好きな食材")}
              allowSelectAll
              options={INGREDIENTS}
              selected={profile.likedIngredients}
              onChange={(v) => set("likedIngredients", v)}
              tone="green"
            />
          </section>
          <section className="form-section">
            <h3>{t("苦手な食材")}</h3>
            <IngredientPicker
              label={t("苦手な食材")}
              options={INGREDIENTS}
              selected={profile.dislikedIngredients}
              onChange={(v) => set("dislikedIngredients", v)}
              tone="gray"
            />
          </section>
          <section className="form-section">
            <h3>{t("好きな料理ジャンル")}</h3>
            <SelectionActions
              options={CUISINES}
              selected={profile.likedCuisines}
              onChange={(v) => set("likedCuisines", v)}
              label={t("好きな料理ジャンル")}
            />
            <Tags
              options={CUISINES}
              selected={profile.likedCuisines}
              onChange={(v) => set("likedCuisines", v)}
              tone="green"
            />
          </section>
          <section className="form-section">
            <h3>{t("苦手な料理ジャンル")}</h3>
            <Tags
              options={CUISINES}
              selected={profile.dislikedCuisines}
              onChange={(v) => set("dislikedCuisines", v)}
              tone="gray"
            />
          </section>
          <p className="small muted">
            {t("同じ項目は「好き」「苦手」のいずれかに登録できます。")}
          </p>
        </>
      )}
      <div className="form-actions">
        {step === 1 && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setStep(0)}
          >
            {t("戻る")}
          </button>
        )}
        <button className="button primary" type="submit">
          {t(
            step === 0 ? (
              "食の好みへ進む"
            ) : (
              <>
                <Check size={17} />
                {t(submitLabel)}
              </>
            ),
          )}
        </button>
      </div>
    </form>
  );
}
