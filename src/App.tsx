import { useLocale } from "./hooks/useLocale";
import {
  useEffect,
  useState,
  type ReactNode,
  Component,
  type ErrorInfo,
} from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Utensils,
  Users,
  RotateCcw,
  UserRound,
  Check,
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "./hooks/useLocale";
import { StoreProvider, useStore } from "./hooks/useStore";
import SearchPage from "./pages/Search";
import {
  CreateGroup,
  GroupList,
  JoinGroup,
  GroupManagement,
  PersonalProfile,
} from "./pages/Groups";
import Detail, { Decision } from "./pages/Detail";
import RestaurantForm from "./pages/RestaurantForm";
import { Empty, Modal } from "./components/ui";
function Shell() {
  const { t } = useLocale();
  const { error, reset } = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [location.pathname]);
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label={t("mogu ホーム")}>
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path
                d="M4 12v12c0 5 7 5 7 0V14c0-5 7-5 7 0v10c0 5 7 5 7 0V14c0-5 7-5 7 0v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{t("mogu")}</span>
            <small>{t("みんなで、おいしく。")}</small>
          </Link>
          <nav className={menuOpen ? "open" : ""}>
            <NavLink to="/" end>
              <Utensils size={17} />
              {t("お店を探す")}
            </NavLink>
            <NavLink to="/groups">
              <Users size={17} />
              {t("マイグループ")}
            </NavLink>
            <NavLink to="/restaurants/new">{t("店舗の方へ")}</NavLink>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <span className="demo-pill">{t("DEMO")}</span>
            <button
              className="icon-button reset-button"
              aria-label={t("デモデータをリセット")}
              title={t("デモデータをリセット")}
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw size={18} />
            </button>
            <Link
              className="profile-button"
              to="/profile"
              aria-label={t("自分のプロフィール")}
            >
              <UserRound size={19} />
            </Link>
            <button
              className="icon-button mobile-nav-button"
              aria-label={t("メニュー")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main className="main-container">
        {t(
          error && (
            <div className="notice" role="alert">
              <p>{t(error)}</p>
              <button className="text-link" onClick={() => setResetOpen(true)}>
                {t("リセット")}
              </button>
            </div>
          ),
        )}
        {resetDone && (
          <div className="green-notice" role="status">
            <Check size={17} />
            {t("初期データに戻しました。")}
            <button
              className="icon-button"
              aria-label={t("通知を閉じる")}
              onClick={() => setResetDone(false)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<SearchPage home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/groups" element={<GroupList />} />
          <Route path="/groups/new" element={<CreateGroup />} />
          <Route path="/join/:id" element={<JoinGroup />} />
          <Route path="/groups/:id" element={<GroupManagement />} />
          <Route path="/groups/:id/decision" element={<Decision />} />
          <Route
            path="/restaurants/new"
            element={<RestaurantForm key="new" />}
          />
          <Route
            path="/restaurants/:id/edit"
            element={<RestaurantForm key={location.pathname} />}
          />
          <Route path="/restaurants/:id" element={<Detail />} />
          <Route path="/profile" element={<PersonalProfile />} />
          <Route path="*" element={<Empty title="ページが見つかりません" />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link className="footer-brand" to="/">
          {t("mogu")}
          <span>{t("みんなの「食べたい」が、ひとつになる。")}</span>
        </Link>
        <span>{t("ハッカソンデモ · 店舗・人物・情報は架空です")}</span>
        <button className="text-link" onClick={() => setResetOpen(true)}>
          {t("初期データにリセット")}
        </button>
      </footer>
      {resetOpen && (
        <Modal
          title={t("デモを初期状態に戻しますか？")}
          onClose={() => setResetOpen(false)}
        >
          <p>
            {t(
              "追加・編集したグループ、プロフィール、店舗とお店の決定を削除し、20店舗・4人の初期データに戻します。",
            )}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setResetOpen(false)}
            >
              {t("キャンセル")}
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (reset()) {
                  setResetOpen(false);
                  setResetDone(true);
                  navigate("/");
                }
              }}
            >
              {t("初期状態に戻す")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
class ErrorBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    hasError: boolean;
  }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
function ErrorFallback() {
  const { t } = useLocale();
  return (
    <div className="empty">
      <h1>{t("画面を表示できませんでした")}</h1>
      <p>
        {t(
          "保存データに問題がある可能性があります。再読み込みするか、デモデータをリセットしてください。",
        )}
      </p>
      <button
        className="button secondary"
        onClick={() => window.location.reload()}
      >
        {t("再読み込み")}
      </button>
      <button
        className="button primary"
        onClick={() => {
          if (window.confirm(t("デモの保存データを削除しますか？"))) {
            localStorage.removeItem("mogu-demo-v1");
            window.location.reload();
          }
        }}
      >
        {t("データをリセット")}
      </button>
    </div>
  );
}
export default function App() {
  const { t } = useLocale();
  return (
    <ErrorBoundary>
      <StoreProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
