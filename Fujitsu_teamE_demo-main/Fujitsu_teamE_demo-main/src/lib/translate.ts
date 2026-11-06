import { TRANSLATIONS, type Locale } from "./translations";
export function translate(text: string, locale: Locale): string {
  if (locale === "ja" || !text) return text;
  const index = locale === "en" ? 0 : locale === "zh" ? 1 : 2;
  const choose = (en: string, zh: string, ko: string) => [en, zh, ko][index];
  const tr = (value: string) => translate(value, locale);
  const key = text.replace(/\s+/g, " ").trim();
  const direct = TRANSLATIONS[key];
  if (direct) return direct[index];
  let m: RegExpMatchArray | null;
  if ((m = key.match(/^(\d+)人が参加中$/)))
    return choose(
      `${m[1]} ${m[1] === "1" ? "member" : "members"}`,
      `${m[1]}位成员`,
      `${m[1]}명 참여 중`,
    );
  if (
    (m = key.match(
      /^(.*)さんの(.*)アレルギー：店舗全体で(使用あり|使用状況が未確認)です。$/,
    ))
  )
    return choose(
      `${m[1]} · ${tr(m[2])} allergy: ${m[3] === "使用あり" ? "used" : "use unconfirmed"} restaurant-wide.`,
      `${m[1]}的${tr(m[2])}过敏：餐厅整体${m[3] === "使用あり" ? "使用中" : "使用情况未确认"}。`,
      `${m[1]}님의 ${tr(m[2])} 알레르기: 식당 전체 ${m[3] === "使用あり" ? "사용 중" : "사용 현황 미확인"}.`,
    );
  if (
    (m = key.match(
      /^(好きな食材|苦手な食材|好きなジャンル|苦手なジャンル|確認する食材)：(.*)$/,
    ))
  )
    return `${tr(m[1])}: ${tr(m[2])}`;
  if ((m = key.match(/^(\d+)人の「好き」が見つかるお店$/)))
    return choose(
      `Matches ${m[1]} members' likes`,
      `符合${m[1]}位成员的喜好`,
      `${m[1]}명의 취향에 맞는 식당`,
    );
  if ((m = key.match(/^(.*)を検索（例：えび、たまご）$/)))
    return choose(
      `Search ${tr(m[1])} (e.g. shrimp, egg)`,
      `搜索${tr(m[1])}（如：虾、鸡蛋）`,
      `${tr(m[1])} 검색 (예: 새우, 달걀)`,
    );
  if ((m = key.match(/^(.*)を検索$/)))
    return choose(`Search ${tr(m[1])}`, `搜索${tr(m[1])}`, `${tr(m[1])} 검색`);
  if ((m = key.match(/^(.*)を全選択$/)))
    return choose(
      `Select all ${tr(m[1])}`,
      `全选${tr(m[1])}`,
      `${tr(m[1])} 전체 선택`,
    );
  if ((m = key.match(/^(.*)の選択をすべて解除$/)))
    return choose(
      `Clear all ${tr(m[1])}`,
      `取消全部${tr(m[1])}`,
      `${tr(m[1])} 전체 해제`,
    );
  if ((m = key.match(/^(.*)を解除$/)))
    return choose(`Remove ${tr(m[1])}`, `取消${tr(m[1])}`, `${tr(m[1])} 해제`);
  if ((m = key.match(/^(.*)のプロフィールを編集$/)))
    return choose(
      `Edit ${m[1]}'s profile`,
      `编辑${m[1]}的资料`,
      `${m[1]}님의 프로필 수정`,
    );
  if ((m = key.match(/^ほか(\d+)人$/)))
    return choose(` + ${m[1]} more`, ` 及其他${m[1]}人`, ` 외 ${m[1]}명`);
  if ((m = key.match(/^(.*)の画像を選択$/)))
    return choose(
      `Choose a ${tr(m[1])} image`,
      `选择${tr(m[1])}图片`,
      `${tr(m[1])} 이미지 선택`,
    );
  if ((m = key.match(/^読み取り中… (\d+)%$/)))
    return choose(`Reading… ${m[1]}%`, `读取中… ${m[1]}%`, `읽는 중… ${m[1]}%`);
  if ((m = key.match(/^(.*)の店舗全体の使用状況$/)))
    return choose(
      `Restaurant-wide use of ${tr(m[1])}`,
      `${tr(m[1])}的餐厅整体使用情况`,
      `${tr(m[1])} 식당 전체 사용 현황`,
    );
  if ((m = key.match(/^メニュー(\d+)を削除$/)))
    return choose(
      `Remove dish ${m[1]}`,
      `删除菜品${m[1]}`,
      `메뉴 ${m[1]} 삭제`,
    );
  if ((m = key.match(/^(.*)の料理(?:写真)?（イメージ）$/)))
    return choose(
      `${m[1]} food (illustration)`,
      `${m[1]}菜品（示意）`,
      `${m[1]} 음식 (예시)`,
    );
  if ((m = key.match(/^(.*)（写真はイメージ）$/)))
    return choose(
      `${tr(m[1])} (illustrative photo)`,
      `${tr(m[1])}（示意照片）`,
      `${tr(m[1])} (예시 사진)`,
    );
  if ((m = key.match(/^(.*)のおすすめ$/)))
    return choose(
      `Recommendations for ${m[1]}`,
      `为${m[1]}推荐`,
      `${m[1]}님에게 추천`,
    );
  if (
    (m = key.match(
      /^(.*)の路地に佇む、(.*)のお店。季節ごとに変わる食材と、ゆっくり過ごせる空間を大切にしています。友人との食事にも、いつもの一人ごはんにも。$/,
    ))
  )
    return choose(
      `A ${tr(m[2])} restaurant in ${tr(m[1])}, with seasonal ingredients and a relaxed atmosphere. Enjoy it with friends or on your own.`,
      `位于${tr(m[1])}小巷中的${tr(m[2])}餐厅，注重时令食材和舒适空间，适合朋友聚餐或独自用餐。`,
      `${tr(m[1])} 골목의 ${tr(m[2])} 식당입니다. 제철 식재료와 여유로운 공간을 중시하며 친구와의 식사나 혼밥에 좋습니다.`,
    );
  if ((m = key.match(/^東京都(.*)区こもれび町(.*)（架空）$/)))
    return choose(
      `${m[2]} Komorebi, ${tr(m[1])}, Tokyo (fictional)`,
      `东京都${tr(m[1])}区阳光町${m[2]}（虚构）`,
      `도쿄 ${tr(m[1])}구 코모레비 ${m[2]} (가상)`,
    );
  if (key.includes("（火曜定休）"))
    return key.replace(
      "（火曜定休）",
      choose(" (closed Tue)", "（周二休息）", " (화요일 휴무)"),
    );
  if (key.includes("（月曜定休）"))
    return key.replace(
      "（月曜定休）",
      choose(" (closed Mon)", "（周一休息）", " (월요일 휴무)"),
    );
  if (key.includes(" / ")) return key.split(" / ").map(tr).join(" / ");
  if (key.includes("・")) return key.split("・").map(tr).join(" · ");
  return text;
}
