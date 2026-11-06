import { useLocale } from "../hooks/useLocale";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Copy,
  Users,
  Plus,
  Pencil,
  ShieldCheck,
  Search,
  Link as LinkIcon,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import type { UserProfile } from "../types";
import { GroupCards } from "../components/GroupCards";
import { ProfileForm } from "../components/ProfileForm";
import { Avatar, Empty, Modal, ProfileSummary } from "../components/ui";
export function GroupList() {
  const { t } = useLocale();
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const groups = [...data.groups]
    .reverse()
    .filter((g) =>
      `${g.name} ${g.members.map((m) => m.nickname).join(" ")}`
        .normalize("NFKC")
        .toLowerCase()
        .includes(query.trim().normalize("NFKC").toLowerCase()),
    );
  return (
    <div className="groups-page">
      <div className="page-title inline-title">
        <div>
          <div className="eyebrow">{t("YOUR GROUPS")}</div>
          <h1>{t("マイグループ")}</h1>
          <p>
            {t(
              "友だちと、家族と、仕事仲間と。ごはん会ごとに、みんなの好みをまとめよう。",
            )}
          </p>
        </div>
        <Link className="button primary" to="/groups/new">
          <Plus size={18} />
          {t("新しいグループ")}
        </Link>
      </div>
      <div className="groups-toolbar">
        <span>
          <strong>{data.groups.length}</strong>
          {t("グループ")}
        </span>
        <label className="ingredient-search">
          <Search size={18} />
          <input
            aria-label={t("グループを検索")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("グループ名・参加者名で検索")}
          />
        </label>
      </div>
      {groups.length ? (
        <GroupCards groups={groups} restaurants={data.restaurants} />
      ) : (
        <div className="group-list-empty">
          <Users size={32} />
          <h2>
            {t(
              query
                ? "一致するグループがありません"
                : "最初のグループを作りましょう",
            )}
          </h2>
          <p>
            {t(
              query
                ? "グループ名や参加者名を変えて検索してください。"
                : "名前とニックネームだけで、すぐに作成できます。",
            )}
          </p>
          {query ? (
            <button className="button secondary" onClick={() => setQuery("")}>
              {t("検索をクリア")}
            </button>
          ) : (
            <Link className="button primary" to="/groups/new">
              {t("グループを作成")}
            </Link>
          )}
        </div>
      )}
      <p className="small muted groups-storage-note">
        {t(
          "グループはこのブラウザに保存されます。招待URLは同じブラウザの別タブで利用できます。",
        )}
      </p>
    </div>
  );
}
export function CreateGroup() {
  const { t } = useLocale();
  const { data, update } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("新しいごはん会");
  const [nickname, setNickname] = useState(data.profile.nickname || "幹事さん");
  const save = () => {
    const id = crypto.randomUUID();
    const profile = {
      ...structuredClone(data.profile),
      id: crypto.randomUUID(),
      nickname: nickname.trim(),
    };
    if (
      update((d) => ({
        ...d,
        groups: [
          ...d.groups,
          { id, name: name.trim(), hostId: profile.id, members: [profile] },
        ],
      }))
    )
      navigate(`/groups/${id}`);
  };
  return (
    <div className="narrow-page">
      <Link className="back-link" to="/groups">
        {t("マイグループへ戻る")}
      </Link>
      <div className="page-title">
        <div className="eyebrow">{t("NEW GROUP")}</div>
        <h1>{t("ごはん会を作ろう。")}</h1>
        <p>{t("名前を決めて、ワンクリックでスタート。")}</p>
      </div>
      <form
        className="form-card"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="field">
          {t("グループ名")}
          <input
            autoFocus
            required
            maxLength={48}
            pattern={".*\\S.*"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          {t("幹事のニックネーム")}
          <input
            required
            maxLength={24}
            pattern={".*\\S.*"}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        <div className="notice compact">
          {t(
            "自分のプロフィールを引き継ぎます。アレルギー・食の好みは作成後に編集できます。",
          )}
        </div>
        <p className="small muted">
          {t("招待URLは同じブラウザの別タブで利用できます。")}
        </p>
        <button className="button primary">
          <Plus size={18} />
          {t("グループを作成")}
        </button>
      </form>
    </div>
  );
}
export function JoinGroup() {
  const { t } = useLocale();
  const { id } = useParams();
  const { data, update } = useStore();
  const navigate = useNavigate();
  const group = data.groups.find((g) => g.id === id);
  if (!group)
    return (
      <Empty title={t("このグループが見つかりません")}>
        <p>
          {t(
            "招待URLを確認してください。同じブラウザの保存領域にグループがある場合のみ参加できます。",
          )}
        </p>
      </Empty>
    );
  return (
    <div className="narrow-page">
      <div className="page-title">
        <div className="eyebrow">{t("YOU'RE INVITED")}</div>
        <h1>
          {t("「")}
          {group.name}
          {t("」")}
          <br />
          {t("に参加しよう。")}
        </h1>
        <p>{t("ニックネームと食の好みだけ。メールやパスワードは不要です。")}</p>
      </div>
      <div className="form-card">
        <ProfileForm
          onSave={(profile) => {
            if (
              update((d) => {
                const current = d.groups.find((g) => g.id === id);
                if (!current) throw new Error("missing group");
                return {
                  ...d,
                  groups: d.groups.map((g) =>
                    g.id === id
                      ? { ...g, members: [...g.members, profile] }
                      : g,
                  ),
                };
              })
            )
              navigate(`/groups/${id}`);
          }}
          submitLabel={t("グループに参加")}
        />
      </div>
    </div>
  );
}
export function PersonalProfile() {
  const { t } = useLocale();
  const { data, update } = useStore();
  const navigate = useNavigate();
  return (
    <div className="narrow-page">
      <div className="page-title">
        <div className="eyebrow">{t("YOUR TASTE")}</div>
        <h1>{t("あなたの食の好み")}</h1>
        <p>
          {t(
            "個人検索に反映されます。グループ内のプロフィールはグループ画面で編集できます。",
          )}
        </p>
      </div>
      <div className="form-card">
        <ProfileForm
          initial={data.profile}
          onSave={(profile) => {
            if (update((d) => ({ ...d, profile })))
              navigate("/search?mode=personal");
          }}
        />
      </div>
    </div>
  );
}
export function GroupManagement() {
  const { t } = useLocale();
  const { id } = useParams();
  const { data, update } = useStore();
  const group = data.groups.find((g) => g.id === id);
  const [editing, setEditing] = useState<UserProfile | "new" | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const invitation = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${id}`;
  if (!group) return <Empty title={t("グループが見つかりません")} />;
  const save = (profile: UserProfile) => {
    if (
      update((d) => {
        if (!d.groups.some((g) => g.id === id))
          throw new Error("missing group");
        return {
          ...d,
          groups: d.groups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  members:
                    editing === "new"
                      ? [...g.members, profile]
                      : g.members.map((m) =>
                          m.id === profile.id ? profile : m,
                        ),
                }
              : g,
          ),
        };
      })
    )
      setEditing(null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invitation);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };
  return (
    <>
      <Link className="back-link" to="/groups">
        {t("グループ一覧へ戻る")}
      </Link>
      <div className="page-title inline-title">
        <div>
          <div className="eyebrow">{t("YOUR GROUP")}</div>
          <h1>{group.name}</h1>
          <p>
            {group.members.length}
            {t("人の食の好みを、ひとつの食卓に。")}
          </p>
        </div>
        <Link className="button primary" to={`/search?group=${id}`}>
          <Search size={18} />
          {t("みんなでお店を探す")}
        </Link>
      </div>
      <div className="invite-banner">
        <div>
          <LinkIcon size={22} />
          <div>
            <h3>{t("食の好みを、招待リンクで集めよう")}</h3>
            <p>
              {t(
                "同じブラウザの別タブで開いて参加できます。別端末との同期はありません。",
              )}
            </p>
          </div>
        </div>
        <button className="button secondary" onClick={copy}>
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {t(" ")}
          {t(copied ? "コピーしました" : "招待URLをコピー")}
        </button>
        <label className="invite-link">
          <span className="sr-only">{t("招待URL")}</span>
          <input
            readOnly
            value={invitation}
            onFocus={(e) => e.target.select()}
          />
        </label>
        {copyFailed && (
          <p role="status">
            {t("コピーできませんでした。上のURLを選択してコピーしてください。")}
          </p>
        )}
        <Link className="text-link small" to={`/join/${id}`} target="_blank">
          {t("別タブで参加画面を開く")}
        </Link>
      </div>
      <div className="section-heading">
        <h2>
          <Users size={22} />
          {t("参加者")}
          <span className="result-count">
            {group.members.length}
            {t("人")}
          </span>
        </h2>
        <button className="button secondary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          {t("参加者を追加")}
        </button>
      </div>
      <div className="member-grid">
        {group.members.map((m, i) => (
          <article className="member-card" key={m.id}>
            <div className="member-header">
              <Avatar name={m.nickname} index={i} />
              <div>
                <h3>{m.nickname}</h3>
                <span className="small muted">
                  {t(m.id === group.hostId ? "幹事" : "ゲスト")}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label={t(`${m.nickname}のプロフィールを編集`)}
                onClick={() => setEditing(m)}
              >
                <Pencil size={17} />
              </button>
            </div>
            <div className="member-allergies">
              <h4>
                <ShieldCheck size={16} />
                {t("アレルギー")}
              </h4>
              <ProfileSummary values={m.allergies} allergies />
            </div>
            <h4>{t("好きな食材")}</h4>
            <ProfileSummary values={m.likedIngredients} />
            <h4>{t("苦手な食材")}</h4>
            <ProfileSummary values={m.dislikedIngredients} />
            <h4>{t("好きなジャンル")}</h4>
            <ProfileSummary values={m.likedCuisines} />
            <h4>{t("苦手なジャンル")}</h4>
            <ProfileSummary values={m.dislikedCuisines} />
          </article>
        ))}
      </div>
      {t(
        group.selectedRestaurantId && (
          <Link className="decision-banner" to={`/groups/${id}/decision`}>
            <Check size={22} />
            <span>{t("決定したお店を確認する")}</span>
          </Link>
        ),
      )}
      {editing && (
        <Modal
          title={t(editing === "new" ? "参加者を追加" : "食の好みを編集")}
          onClose={() => setEditing(null)}
        >
          <ProfileForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? undefined : editing}
            onSave={save}
          />
        </Modal>
      )}
    </>
  );
}
