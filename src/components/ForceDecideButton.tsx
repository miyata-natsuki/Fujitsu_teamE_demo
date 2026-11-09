import { useState } from "react";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./ui";
/** アレルギー情報に注意点があるお店を、警告を確認したうえで決定する。 */
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
        <Modal
          title="アレルギー情報に確認が必要なお店です。決定しますか？"
          onClose={() => setOpen(false)}
        >
          <p>
            <strong>{name}</strong>
            {t("は、アレルギー情報に次の確認事項があります。")}
          </p>
          {reasons.map((reason) => (
            <p className="small" key={reason}>
              {t(reason)}
            </p>
          ))}
          <p className="small muted">
            {t(
              "安全性は保証されません。決定する場合は店舗へ直接ご確認ください。",
            )}
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
