import { useState } from "react";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./ui";
/** Decide on a restaurant that was excluded by allergy matching, after an explicit warning. */
export function ForceDecideButton({
  name,
  reasons,
  onConfirm,
}: {
  name: string;
  reasons: string[];
  onConfirm: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(true)}
      >
        {t("このお店に決定")}
      </button>
      {open && (
        <Modal title="除外されたお店を決定しますか？" onClose={() => setOpen(false)}>
          <p>
            <strong>{name}</strong>
            {t("はアレルギー条件に一致しないため、候補から除外されています。")}
          </p>
          {reasons.map((reason) => (
            <p className="small" key={reason}>
              {t(reason)}
            </p>
          ))}
          <p className="small muted">
            {t("安全性は保証されません。決定する場合は店舗へ直接ご確認ください。")}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setOpen(false)}
            >
              {t("やめる")}
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t("それでも決定する")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
