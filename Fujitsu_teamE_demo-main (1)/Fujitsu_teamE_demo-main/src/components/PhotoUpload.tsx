import { useState } from "react";
import { Upload } from "lucide-react";
import { useLocale } from "../hooks/useLocale";
import { preparePhoto } from "../lib/photoUpload";
import { FoodImage } from "./ui";

export function PhotoUpload({
  label,
  src,
  fallback,
  onChange,
  onBusy,
}: {
  label: string;
  src: string;
  fallback: string;
  onChange: (src: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="photo-upload">
      <FoodImage src={src} alt={label} />
      <div>
        <strong>{label}</strong>
        <label className="field">
          <span>
            <Upload size={16} /> {t("写真をアップロード")}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={label}
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setBusy(true);
              onBusy(true);
              setError("");
              try {
                onChange(await preparePhoto(file));
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "画像を開けませんでした。別の画像を選択してください。",
                );
              } finally {
                setBusy(false);
                onBusy(false);
              }
            }}
          />
        </label>
        <p className="small muted">
          {t("JPEG・PNG・WebP / 8MBまで。保存用に画像を縮小します。")}
        </p>
        {busy && <p role="status">{t("写真を準備しています…")}</p>}
        {error && (
          <p role="alert" className="error-text">
            {t(error)}
          </p>
        )}
        {src.startsWith("data:image/") && (
          <button
            type="button"
            className="text-link small"
            disabled={busy}
            onClick={() => {
              onChange(fallback);
              setError("");
            }}
          >
            {t("ダミー写真に戻す")}
          </button>
        )}
      </div>
    </div>
  );
}
