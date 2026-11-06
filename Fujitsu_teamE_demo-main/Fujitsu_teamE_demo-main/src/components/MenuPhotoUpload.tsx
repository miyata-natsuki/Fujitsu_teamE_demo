import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { useLocale } from "../hooks/useLocale";
import { useStore } from "../hooks/useStore";
import { parseMenuText } from "../lib/foodInput";
import { applyMenuPhoto } from "../lib/menuUpdate";
import type { Restaurant } from "../types";
// Shrink to a small JPEG data URL so it fits in localStorage.
const shrink = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
export function MenuPhotoUpload({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useLocale();
  const { update } = useStore();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onFile = async (file?: File) => {
    if (!file) return;
    setMessage("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("JPEG・PNG・WebP画像（8MB以内）を選んでください。");
      return;
    }
    setError("");
    setBusy(true);
    setProgress(0);
    const url = URL.createObjectURL(file);
    try {
      const image = await shrink(url);
      let text = "";
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("jpn+eng", 1, {
          logger: (m) => {
            if (mounted.current)
              setProgress(
                Math.round(
                  (m.status === "recognizing text"
                    ? 0.4 + m.progress * 0.6
                    : m.progress * 0.4) * 100,
                ),
              );
          },
          errorHandler: () => {},
        });
        try {
          text = (await worker.recognize(url)).data.text;
        } finally {
          await worker.terminate();
        }
      } catch {
        // Offline or unreadable: fall back to adding the photo itself.
      }
      const fallbackName =
        file.name.replace(/\.[^.]+$/, "").slice(0, 60).trim() ||
        "投稿された料理";
      let counts = { added: 0, updated: 0 };
      const saved = update((d) => ({
        ...d,
        restaurants: d.restaurants.map((r) => {
          if (r.id !== restaurant.id) return r;
          const res = applyMenuPhoto(
            r,
            parseMenuText(text),
            image,
            fallbackName,
          );
          counts = res;
          return res.restaurant;
        }),
      }));
      if (mounted.current && saved)
        setMessage(
          `メニューを更新しました（追加${counts.added}件・更新${counts.updated}件）。原材料・アレルゲンは未確認として扱われます。`,
        );
    } catch {
      if (mounted.current) setError("画像を処理できませんでした。");
    } finally {
      URL.revokeObjectURL(url);
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <div className="contact-note">
      <strong>{t("メニュー・料理の写真からお店のメニューを更新")}</strong>
      <p className="small muted">
        {t(
          "写真を選ぶと文字を自動で読み取り、メニューに反映します。文字が読めない料理写真は、そのままメニューに追加します。追加分は原材料・アレルゲン未確認のため、おすすめには使われません。",
        )}
      </p>
      <label className="button secondary">
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Camera size={17} />
        )}
        {t(busy ? `更新中… ${progress}%` : "写真をアップロード")}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={t("メニュー・料理の写真を選択")}
          disabled={busy}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <div role="status">
        {message && <p className="small green-text">{t(message)}</p>}
      </div>
      {error && (
        <p role="alert" className="error-text">
          {t(error)}
        </p>
      )}
    </div>
  );
}
