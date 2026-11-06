import { useLocale } from "../hooks/useLocale";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Upload,
  ScanLine,
  Plus,
  Trash2,
  ShieldCheck,
  LoaderCircle,
  Search,
} from "lucide-react";
import {
  ALLERGENS,
  AREAS,
  CUISINES,
  INGREDIENTS,
  STATUS_LABELS,
  allergenLabel,
} from "../data/constants";
import { MOCK_RECEIPT, photo } from "../data/seed";
import type { Restaurant, MenuItem, AllergenStatus } from "../types";
import { useStore } from "../hooks/useStore";
import {
  parseFoodText,
  parseMenuText,
  foodSearchMatch,
  type ExtractedProduct,
} from "../lib/foodInput";
import type { Worker } from "tesseract.js";
import { reconcileAllergens } from "../lib/matching";
import { AllergenPanel, Empty, FoodImage, yen } from "../components/ui";
import { IngredientPicker } from "../components/IngredientPicker";
import { PhotoUpload } from "../components/PhotoUpload";
const steps = [
  "基本情報",
  "画像の読み取り",
  "読み取り結果",
  "情報の確認",
  "メニュー",
  "登録",
];
const newMenu = (): MenuItem => ({
  id: crypto.randomUUID(),
  name: "季節の野菜プレート",
  price: 1500,
  description: "彩り豊かな野菜とごはんのデモメニュー",
  image: photo("salad"),
  ingredients: ["野菜", "米", "玉ねぎ"],
  allergens: [],
  allergenReviewStatus: "unconfirmed",
});
const newRestaurant = (): Restaurant => ({
  id: crypto.randomUUID(),
  name: "季節の食卓 こもれび（デモ）",
  area: "渋谷",
  cuisine: "和食",
  price: 2500,
  description: "旬の野菜を中心に、ゆっくり食事を楽しめる架空のお店です。",
  images: [photo("japanese"), photo("salad")],
  address: "東京都渋谷区デモ通り1-2-3（架空）",
  location: { x: 52, y: 45 },
  openingHours: "11:00–21:00",
  rating: 0,
  allergenStatuses: Object.fromEntries(
    ALLERGENS.map(([id]) => [id, "unknown"]),
  ),
  crossContactInfo:
    "調理環境・交差接触への対応は未確認です。利用前に店舗への確認が必要です。",
  menus: [newMenu()],
  reviews: [],
});
export default function RestaurantForm() {
  const { t } = useLocale();
  const { id } = useParams();
  const { data, update } = useStore();
  const existing = data.restaurants.find((r) => r.id === id);
  const navigate = useNavigate();
  const [r, setR] = useState<Restaurant>(() =>
    existing ? structuredClone(existing) : newRestaurant(),
  );
  const [step, setStep] = useState(0);
  const [uploadingPhotos, setUploadingPhotos] = useState(0);
  const photoBusy = (busy: boolean) =>
    setUploadingPhotos((count) => count + (busy ? 1 : -1));
  const [allergenQuery, setAllergenQuery] = useState("");
  const [receipt, setReceipt] = useState("");
  const [filename, setFilename] = useState("");
  const [reading, setReading] = useState(false);
  const [read, setRead] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [documentType, setDocumentType] = useState<"receipt" | "menu">(
    "receipt",
  );
  const [sample, setSample] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [progress, setProgress] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const mounted = useRef(true);
  const job = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      job.current++;
      void workerRef.current?.terminate();
    };
  }, []);
  useEffect(
    () => () => {
      if (receipt.startsWith("blob:")) URL.revokeObjectURL(receipt);
    },
    [receipt],
  );
  if (id && !existing)
    return <Empty title={t("編集するお店が見つかりません")} />;
  const set = <K extends keyof Restaurant>(key: K, value: Restaurant[K]) =>
    setR((p) => ({ ...p, [key]: value }));
  const menuSet = (menuId: string, change: Partial<MenuItem>) =>
    setR((p) => ({
      ...p,
      menus: p.menus.map((m) => (m.id === menuId ? { ...m, ...change } : m)),
    }));
  const upload = (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("JPEG・PNG・WebP画像（8MB以内）を選んでください。");
      return;
    }
    setError("");
    setFilename(file.name);
    setReceipt(URL.createObjectURL(file));
    setRead(false);
    setSample(false);
    setProducts([]);
    setOcrText("");
  };
  const applyText = (text: string) => {
    const extracted = parseFoodText(text);
    setProducts(extracted);
    if (documentType === "menu") {
      const menus = parseMenuText(text);
      if (menus.length)
        setR((p) => ({
          ...p,
          menus: menus.map((m) => ({
            ...newMenu(),
            ...m,
            description:
              "メニュー表からの読み取り候補。原材料は別途確認してください。",
            allergenReviewStatus: "unconfirmed",
          })),
        }));
    }
    return extracted.length;
  };
  const runOcr = async () => {
    const token = ++job.current;
    setReading(true);
    setRead(false);
    setError("");
    setProgress(0);
    try {
      let text: string;
      if (sample) {
        text =
          documentType === "receipt"
            ? MOCK_RECEIPT.products.map((p) => p.name).join("\n")
            : "季節の野菜プレート 1500円\n牛肉と玉ねぎのステーキ 2200円\nえびとトマトのパスタ 1800円";
      } else {
        const { createWorker } = await import("tesseract.js");
        if (!mounted.current || token !== job.current) return;
        const worker = await createWorker("jpn+eng", 1, {
          logger: (m) => {
            if (mounted.current && token === job.current)
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
        if (!mounted.current || token !== job.current) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker;
        try {
          const result = await worker.recognize(receipt);
          text = result.data.text;
        } finally {
          await worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        }
      }
      if (!mounted.current || token !== job.current) return;
      setOcrText(text);
      setProgress(100);
      if (!applyText(text)) {
        setError(
          "文字を検出できませんでした。明るく鮮明な画像で再試行するか、手動入力してください。",
        );
        return;
      }
      if (sample && documentType === "receipt")
        setProducts(
          MOCK_RECEIPT.products.map((p) => ({
            ...p,
            candidates: [...p.candidates],
            confirmed: false,
          })),
        );
      setRead(true);
    } catch {
      if (mounted.current && token === job.current)
        setError(
          "読み取りに失敗しました。画像や通信環境を確認して再試行してください。",
        );
    } finally {
      if (mounted.current && token === job.current) setReading(false);
    }
  };
  const usedProducts = products
    .filter((p) => p.confirmed)
    .flatMap((p) => p.candidates);
  const final = reconcileAllergens({
    ...r,
    allergenStatuses: {
      ...r.allergenStatuses,
      ...Object.fromEntries(usedProducts.map((a) => [a, "used"])),
    },
  });
  const discrepancies = ALLERGENS.filter(
    ([a]) => final.allergenStatuses[a] !== r.allergenStatuses[a],
  );
  const next = () => {
    if (step === 2)
      setR((p) => ({
        ...p,
        allergenStatuses: {
          ...p.allergenStatuses,
          ...Object.fromEntries(usedProducts.map((a) => [a, "used"])),
        },
      }));
    if (step === 4 && r.menus.some((m) => !m.name.trim() || m.price <= 0)) {
      setError("すべてのメニュー名と、0円より大きい価格を入力してください。");
      return;
    }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const save = () => {
    if (!accepted) return;
    const normalized = {
      ...final,
      name: final.name.trim(),
      menus: final.menus.map((m) => ({ ...m, name: m.name.trim() })),
    };
    if (
      update((d) => ({
        ...d,
        restaurants: id
          ? d.restaurants.map((store) => (store.id === id ? normalized : store))
          : [...d.restaurants, normalized],
      }))
    )
      navigate(`/restaurants/${r.id}`);
  };
  return (
    <div className="registration-page">
      <Link className="back-link" to={id ? `/restaurants/${id}` : "/"}>
        {t("戻る")}
      </Link>
      <div className="page-title">
        <div className="eyebrow">{t("FOR RESTAURANTS")}</div>
        <h1>{t(id ? "店舗情報を編集" : "お店の魅力と、食材の情報を。")}</h1>
        <p>{t("デモ用の店舗情報を登録します。ログインは不要です。")}</p>
      </div>
      <ol className="registration-steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={step === i ? "active" : step > i ? "done" : ""}
          >
            <span>{step > i ? <Check size={16} /> : i + 1}</span>
            {t(s)}
          </li>
        ))}
      </ol>
      <form
        className="form-card registration-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 5) save();
          else next();
        }}
      >
        <div className="step-heading">
          <span>
            {t("STEP")}
            {step + 1}
            {t("/ 6")}
          </span>
          <h2>{t(steps[step])}</h2>
        </div>
        {step === 0 && (
          <>
            {!id && (
              <div className="green-notice dummy-note">
                {t(
                  "店舗名・住所・予算・メニューはダミー情報を自動入力しています。そのまま進めるほか、自由に変更できます。",
                )}
              </div>
            )}
            <div className="form-grid">
              <label className="field">
                {t("店舗名")}
                <input
                  autoFocus
                  required
                  maxLength={60}
                  pattern={".*\\S.*"}
                  value={r.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("例：季節の食卓 こもれび")}
                />
              </label>
              <label className="field">
                {t("エリア")}
                <select
                  value={r.area}
                  onChange={(e) => set("area", e.target.value)}
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {t(a)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t("料理ジャンル")}
                <select
                  value={r.cuisine}
                  onChange={(e) => {
                    set("cuisine", e.target.value);
                    if (
                      !id &&
                      !r.images.some((image) => image.startsWith("data:image/"))
                    )
                      set("images", [
                        photo(
                          (
                            {
                              和食: "japanese",
                              洋食: "steak",
                              中華: "chinese",
                              イタリアン: "pasta",
                              韓国料理: "korean",
                              焼肉: "steak",
                              寿司: "sushi",
                              カフェ: "cafe",
                              エスニック: "curry",
                            } as Record<string, string>
                          )[e.target.value],
                        ),
                        photo("salad"),
                      ]);
                  }}
                >
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t("1人あたりの予算（円）")}
                <input
                  required
                  type="number"
                  min="1"
                  max="100000"
                  value={r.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </label>
              <label className="field span-2">
                {t("住所（架空）")}
                <input
                  required
                  maxLength={100}
                  value={r.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder={t("例：東京都渋谷区こもれび町1-2-3")}
                />
              </label>
              <label className="field span-2">
                {t("営業時間")}
                <input
                  required
                  maxLength={80}
                  value={r.openingHours}
                  onChange={(e) => set("openingHours", e.target.value)}
                />
              </label>
              <label className="field span-2">
                {t("店舗紹介")}
                <textarea
                  required
                  maxLength={500}
                  rows={4}
                  value={r.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t("料理やお店の雰囲気を教えてください")}
                />
              </label>
            </div>
            <p className="small muted">
              {t("写真はジャンルに応じたイメージ写真を設定します。")}
            </p>
            <div className="photo-upload-list">
              {[0, 1].map((index) => (
                <PhotoUpload
                  key={index}
                  label={t(
                    index === 0
                      ? "店舗・料理の写真（メイン）"
                      : "店舗・料理の写真（サブ）",
                  )}
                  src={r.images[index] ?? photo("salad")}
                  fallback={photo("salad")}
                  onBusy={photoBusy}
                  onChange={(image) =>
                    setR((current) => ({
                      ...current,
                      images: [0, 1].map((slot) =>
                        slot === index
                          ? image
                          : (current.images[slot] ?? photo("salad")),
                      ),
                    }))
                  }
                />
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="ocr-type" aria-label={t("読み取る書類")}>
              {(["receipt", "menu"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  disabled={reading}
                  className={`button ${documentType === type ? "primary" : "secondary"}`}
                  onClick={() => {
                    setDocumentType(type);
                    setReceipt("");
                    setFilename("");
                    setRead(false);
                    setProducts([]);
                    setOcrText("");
                    setError("");
                  }}
                >
                  {t(type === "receipt" ? "レシート" : "メニュー表")}
                </button>
              ))}
            </div>
            <div className="ocr-badge">
              <ScanLine size={19} />
              {t("日本語・英語の画像を読み取り")}
            </div>
            <p>
              {t(
                "画像の文字をブラウザ内で認識します。初回は読み取り用データの取得に時間がかかります。結果は必ず確認・修正してください。",
              )}
            </p>
            <label className="upload-box">
              <Upload size={30} />
              <strong>
                {t(
                  filename ||
                    `${documentType === "receipt" ? "レシート" : "メニュー表"}の画像を選択`,
                )}
              </strong>
              <span>{t("JPEG・PNG・WebP / 8MBまで")}</span>
              <input
                disabled={reading}
                className="sr-only"
                aria-label={t("OCR画像を選択")}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <div className="receipt-actions">
              <button
                type="button"
                className="button secondary"
                disabled={reading}
                onClick={() => {
                  setSample(true);
                  setReceipt(
                    documentType === "receipt"
                      ? MOCK_RECEIPT.image
                      : `${import.meta.env.BASE_URL}images/menu-sample.svg`,
                  );
                  setFilename(
                    documentType === "receipt"
                      ? "サンプルレシート"
                      : "サンプルメニュー表",
                  );
                  setRead(false);
                  setProducts([]);
                  setOcrText("");
                  setError("");
                }}
              >
                {t("サンプル")}
                {t(documentType === "receipt" ? "レシート" : "メニュー表")}
                {t("を使う")}
              </button>
              {t(
                receipt && (
                  <button
                    type="button"
                    className="button primary"
                    disabled={reading}
                    onClick={runOcr}
                  >
                    {reading ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <ScanLine size={17} />
                    )}
                    {t(" ")}
                    {t(
                      reading
                        ? `読み取り中… ${progress}%`
                        : sample
                          ? "サンプル結果を表示"
                          : "画像を読み取る",
                    )}
                  </button>
                ),
              )}
            </div>
            {reading && (
              <>
                <progress
                  className="ocr-progress"
                  value={progress}
                  max={100}
                  aria-label={t("OCR進捗")}
                />
                <button
                  type="button"
                  className="text-link small"
                  onClick={() => {
                    job.current++;
                    setReading(false);
                    void workerRef.current?.terminate();
                    workerRef.current = null;
                    setError(
                      "読み取りを中止しました。再試行または手動入力ができます。",
                    );
                  }}
                >
                  {t("読み取りを中止")}
                </button>
              </>
            )}
            {t(
              receipt && (
                <div className={`receipt-preview ${reading ? "scanning" : ""}`}>
                  <img src={receipt} alt={t("選択した書類")} />
                  {reading && <span className="scan-line" />}
                </div>
              ),
            )}
            {sample && (
              <p className="small muted">
                {t(
                  "サンプルは決まった読み取り結果を使います。アップロード画像は実際に文字認識します。",
                )}
              </p>
            )}
            {read && (
              <div className="green-notice" role="status">
                <Check size={18} />
                {products.length}
                {t("件の候補を抽出しました。次へ進んで確認してください。")}
              </div>
            )}
            <button
              type="button"
              className="text-link small"
              disabled={reading}
              onClick={() => {
                setRead(false);
                setProducts([]);
                setStep(3);
                setError("");
              }}
            >
              {t("画像を使わず、手動確認へ進む")}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <label className="field">
              {t("読み取った文字（修正できます）")}
              <textarea
                className="ocr-text"
                value={ocrText}
                maxLength={20000}
                onChange={(e) => {
                  setOcrText(e.target.value);
                  setRead(false);
                }}
              />
            </label>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                if (!applyText(ocrText)) {
                  setError("読み取り結果を入力してください。");
                  setRead(false);
                } else {
                  setRead(true);
                  setError("");
                }
              }}
            >
              {t("修正した文字から候補を更新")}
            </button>
            {!read && (
              <p className="small muted">
                {t(
                  "文字を変更した後は「候補を更新」を押してください。メニュー表の更新はメニュー候補を置き換えます。",
                )}
              </p>
            )}
            <p>
              {t(
                "文字と食材名からの照合候補です。ラベルを確認した想定で、商品ごとに候補を修正し「確認した」を選んでください。未確認の商品は確定情報に反映しません。",
              )}
            </p>
            <div className="product-list">
              {products.map((p, i) => (
                <div
                  className={`product-row ${p.confirmed ? "confirmed" : ""}`}
                  key={i}
                >
                  <div>
                    <label className="field">
                      {t("読み取った商品・料理名")}
                      <input
                        value={p.name}
                        maxLength={180}
                        onChange={(e) =>
                          setProducts((ps) =>
                            ps.map((x, j) =>
                              i === j
                                ? {
                                    ...x,
                                    name: e.target.value,
                                    confirmed: false,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      {t("食材名")}
                      <input
                        value={p.ingredient}
                        maxLength={40}
                        onChange={(e) =>
                          setProducts((ps) =>
                            ps.map((x, j) =>
                              i === j
                                ? {
                                    ...x,
                                    ingredient: e.target.value,
                                    confirmed: false,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="text-link small"
                      type="button"
                      onClick={() =>
                        setProducts((ps) => ps.filter((_, j) => i !== j))
                      }
                    >
                      {t("この候補を削除")}
                    </button>
                    <span className="small muted">
                      {t("メニューに紐付ける食材：")}
                      {t(p.ingredient)}
                    </span>
                    <IngredientPicker
                      label={t("アレルギー食材")}
                      options={ALLERGENS}
                      selected={p.candidates}
                      onChange={(candidates) =>
                        setProducts((ps) =>
                          ps.map((x, j) =>
                            i === j
                              ? { ...x, candidates, confirmed: false }
                              : x,
                          ),
                        )
                      }
                    />
                    {t(p.note && <p className="small muted">{t(p.note)}</p>)}
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={p.confirmed}
                      onChange={(e) =>
                        setProducts((ps) =>
                          ps.map((x, j) =>
                            i === j ? { ...x, confirmed: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    {t("確認した")}
                  </label>
                </div>
              ))}
            </div>
            <div className="notice compact">
              {t(
                "画像に載っていない食材を「不使用」とは判定しません。調味料・加工食品の原材料も別途確認が必要です。",
              )}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p>
              {t(
                "店舗全体の使用状況を確認してください。サンプル商品の確認済み候補は「使用あり」に反映されます。不使用は、店舗全体で確認した場合だけ選んでください。",
              )}
            </p>
            <label className="ingredient-search">
              <Search size={18} />
              <input
                aria-label={t("アレルギー食材を検索")}
                placeholder={t("アレルギー食材を検索（例：えび、たまご）")}
                value={allergenQuery}
                onChange={(e) => setAllergenQuery(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="allergen-editor">
              {ALLERGENS.filter(([a, label]) =>
                foodSearchMatch(a, label, allergenQuery),
              ).map(([a, label]) => (
                <label key={a}>
                  <strong>{t(label)}</strong>
                  <select
                    aria-label={t(`${label}の店舗全体の使用状況`)}
                    value={r.allergenStatuses[a] ?? "unknown"}
                    onChange={(e) =>
                      set("allergenStatuses", {
                        ...r.allergenStatuses,
                        [a]: e.target.value as AllergenStatus,
                      })
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, text]) => (
                      <option value={value} key={value}>
                        {t(text)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {!ALLERGENS.some(([a, label]) =>
              foodSearchMatch(a, label, allergenQuery),
            ) && (
              <p className="small muted">
                {t("該当する食材がありません。検索語を変えてください。")}
              </p>
            )}
            <label className="field">
              {t("調理環境・交差接触について")}
              <textarea
                required
                rows={3}
                maxLength={500}
                value={r.crossContactInfo}
                onChange={(e) => set("crossContactInfo", e.target.value)}
              />
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <button
              type="button"
              className="button secondary"
              disabled={uploadingPhotos > 0}
              onClick={() => {
                setDocumentType("menu");
                setReceipt("");
                setFilename("");
                setSample(false);
                setRead(false);
                setOcrText("");
                setProducts([]);
                setStep(1);
                setError("");
              }}
            >
              <ScanLine size={17} />
              {t("メニュー表の画像から入力する")}
            </button>
            <p>
              {t(
                "食材はメニューごとに選択してください。確認済み商品の食材も、全メニューへ自動で割り当てることはありません。",
              )}
            </p>
            {r.menus.map((m, i) => (
              <section className="menu-editor" key={m.id}>
                <div className="section-heading">
                  <h3>
                    {t("メニュー")}
                    {i + 1}
                  </h3>
                  {r.menus.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      disabled={uploadingPhotos > 0}
                      aria-label={t(`メニュー${i + 1}を削除`)}
                      onClick={() =>
                        set(
                          "menus",
                          r.menus.filter((menu) => menu.id !== m.id),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                <PhotoUpload
                  label={t("メニューの写真")}
                  src={m.image}
                  fallback={photo("salad")}
                  onBusy={photoBusy}
                  onChange={(image) => menuSet(m.id, { image })}
                />
                <div className="form-grid">
                  <label className="field">
                    {t("メニュー名")}
                    <input
                      required
                      maxLength={60}
                      pattern={".*\\S.*"}
                      value={m.name}
                      onChange={(e) => menuSet(m.id, { name: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    {t("価格（円）")}
                    <input
                      required
                      type="number"
                      min="1"
                      max="100000"
                      value={m.price}
                      onChange={(e) =>
                        menuSet(m.id, { price: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="field span-2">
                    {t("説明文")}
                    <input
                      maxLength={180}
                      value={m.description}
                      onChange={(e) =>
                        menuSet(m.id, { description: e.target.value })
                      }
                    />
                  </label>
                </div>
                <h4>{t("使用食材")}</h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={m.ingredients === null}
                    onChange={(e) =>
                      menuSet(m.id, {
                        ingredients: e.target.checked ? null : [],
                        allergenReviewStatus: "unconfirmed",
                      })
                    }
                  />
                  {t("食材情報は未確認")}
                </label>
                {m.ingredients !== null && (
                  <IngredientPicker
                    label={t("使用食材")}
                    options={[
                      ...new Set([
                        ...INGREDIENTS,
                        ...products
                          .filter((p) => p.confirmed)
                          .map((p) => p.ingredient),
                      ]),
                    ]}
                    selected={m.ingredients}
                    onChange={(ingredients) =>
                      menuSet(m.id, {
                        ingredients,
                        allergenReviewStatus: "unconfirmed",
                      })
                    }
                  />
                )}
                <h4>{t("メニューに含まれるアレルゲン")}</h4>
                <IngredientPicker
                  label={t("アレルギー食材")}
                  options={ALLERGENS}
                  selected={m.allergens}
                  onChange={(allergens) =>
                    menuSet(m.id, {
                      allergens,
                      allergenReviewStatus: "unconfirmed",
                    })
                  }
                />
                <label className="checkbox-label review-confirm">
                  <input
                    type="checkbox"
                    checked={m.allergenReviewStatus === "confirmed"}
                    onChange={(e) =>
                      menuSet(m.id, {
                        allergenReviewStatus: e.target.checked
                          ? "confirmed"
                          : "unconfirmed",
                      })
                    }
                  />
                  {t("このメニューの原材料・アレルゲン情報を確認した")}
                </label>
              </section>
            ))}
            <button
              type="button"
              className="button secondary"
              disabled={r.menus.length >= 8}
              onClick={() => set("menus", [...r.menus, newMenu()])}
            >
              <Plus size={17} />
              {t("メニューを追加")}
            </button>
            <p className="small muted">
              {t(
                "確認済みメニューに含まれるアレルゲンは、店舗全体でも「使用あり」に更新します。未確認メニューはおすすめに選ばれません。",
              )}
            </p>
          </>
        )}
        {step === 5 && (
          <>
            <div className="registration-preview">
              <FoodImage src={r.images[0]} alt={t("店舗のイメージ")} />
              <div>
                <h3>{r.name}</h3>
                <p>
                  {t(r.area)}
                  {t("·")}
                  {t(r.cuisine)}
                  {t("·")}
                  {t(yen(r.price))}
                  {t("/ 人")}
                </p>
                <p>
                  {r.menus.length}
                  {t("品のメニュー · 確認済み")}
                  {t(" ")}
                  {
                    r.menus.filter(
                      (m) => m.allergenReviewStatus === "confirmed",
                    ).length
                  }
                  {t("品")}
                </p>
              </div>
            </div>
            <h3>{t("店舗全体のアレルゲン情報")}</h3>
            <AllergenPanel restaurant={final} />
            {discrepancies.length > 0 && (
              <div className="notice compact">
                <ShieldCheck size={18} />
                <p>
                  {t("商品・メニューとの矛盾を防ぐため、")}
                  {t(discrepancies.map(([a]) => allergenLabel(a)).join("・"))}
                  {t("の使用状況を更新します。")}
                </p>
              </div>
            )}
            <label className="checkbox-label review-confirm">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              {t("デモ情報として確認しました。登録内容を検索に反映します。")}
            </label>
          </>
        )}
        {t(
          error && (
            <p role="alert" className="error-text">
              {t(error)}
            </p>
          ),
        )}
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button secondary"
              disabled={reading || uploadingPhotos > 0}
              onClick={() => {
                setStep((s) => s - 1);
                setError("");
              }}
            >
              {t("戻る")}
            </button>
          )}
          <button
            className="button primary"
            type="submit"
            disabled={
              reading ||
              uploadingPhotos > 0 ||
              ((step === 1 || step === 2) && !read) ||
              (step === 5 && !accepted)
            }
          >
            {t(
              step === 5 ? (
                <>
                  <Check size={17} />
                  {t(id ? "変更を保存" : "店舗を登録する")}
                </>
              ) : (
                "次へ進む"
              ),
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
