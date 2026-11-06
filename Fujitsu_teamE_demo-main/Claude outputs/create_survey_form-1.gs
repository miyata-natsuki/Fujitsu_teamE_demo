/**
 * アレルギー対応の飲食店探しサービス アンケートフォーム自動作成スクリプト
 *
 * 使い方:
 * 1. https://script.google.com を開き「新しいプロジェクト」を作成
 * 2. このコードをすべて貼り付けて保存
 * 3. 関数「createSurveyForm」を選んで「実行」(初回は権限の承認が必要)
 * 4. 実行ログ(表示 > ログ)に、編集用URLと回答用URLが表示されます
 */

// ★ここに、実際に作成しているサイトのURLを入力してください(例: 'https://example.com')
var SITE_URL = 'ここにサイトのURLを入力してください';

function createSurveyForm() {
  var form = FormApp.create('アレルギー対応の飲食店探しサービスに関するアンケート');
  form.setDescription(
    'このアンケートは、アレルギーや苦手な食材がある方でも安心して飲食店を選べるサービスの改善のために行っています。\n' +
    '所要時間は約3〜5分です。回答は匿名で、サービスの改善以外には使用しません。\n\n' +
    '【ご回答の前に】\n' +
    '以下のサイトを実際に触って、機能をご確認ください(5分程度)。確認したうえで、設問にお答えください。\n' +
    SITE_URL
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);

  var SCALE_NEED = ['全く必要ない', 'あまり必要ない', 'どちらでもない', 'あると便利', 'ぜひ使いたい'];
  var SCALE_USE = ['使いたくない', 'あまり使いたくない', 'どちらでもない', '使いたい', 'ぜひ使いたい'];

  // ---------- セクション1:回答者について ----------
  form.addSectionHeaderItem().setTitle('セクション1:回答者について');

  form.addMultipleChoiceItem()
    .setTitle('サイトの確認')
    .setHelpText('冒頭に記載のサイトをご確認いただけましたか。確認後に回答をお願いします。\n' + SITE_URL)
    .setChoiceValues(['サイトを確認した', 'まだ確認していない(これから確認する)'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q1. あなたの立場に近いものを選んでください')
    .setChoiceValues(['一般の利用者として', '飲食店の経営・勤務者', 'その他'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q2. ご自身、またはご家族・友人にアレルギーや食べられないものがありますか')
    .setChoiceValues(['自分にある', '家族・友人にある', 'どちらもある', 'ない'])
    .setRequired(true);

  form.addListItem()
    .setTitle('Q3. 外食の頻度はどのくらいですか')
    .setChoiceValues(['週3回以上', '週1〜2回', '月1〜3回', '月1回未満'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q4. 複数人で外食するとき、お店選びで困った経験はありますか')
    .setChoiceValues(['よくある', 'たまにある', 'ほとんどない', 'ない'])
    .setRequired(true);

  // ---------- セクション2:今ある機能 ----------
  form.addPageBreakItem()
    .setTitle('セクション2:今ある機能について')
    .setHelpText('現在すでにある機能です。それぞれ「あったら便利だと思うか」を教えてください。');

  var existing = [
    'アレルギーや苦手食材、エリア、予算を入力すると、条件に合う店を提案してくれる(アレルゲンを含むメニューが1つでもある店は表示されない)',
    '一人で探す場合と、みんなで探す場合でおすすめが切り替わる',
    '共有URLで同行者がアレルギーや苦手食材を入力でき(アプリ登録不要)、全員が食べられる店を提案してくれる',
    '提案されなかった店について、除外された理由(その食材を含むメニューの割合など)を見られる',
    'アレルギー対応の内容などについて、他の利用者の口コミを見られる',
    '多言語に対応している'
  ];

  addScaleQuestions(form, 'Q5', existing, SCALE_NEED, '【あったら便利だと思うか】', true);

  form.addCheckboxItem()
    .setTitle('Q6. 特に便利だと思う機能を、最大3つまで選んでください')
    .setChoiceValues(existing)
    .setValidation(
      FormApp.createCheckboxValidation()
        .setHelpText('3つまで選んでください')
        .requireSelectAtMost(3)
        .build())
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Q7. 今ある機能について、使いにくい点や改善してほしい点があれば教えてください')
    .setRequired(false);

  // ---------- セクション3:検討中の機能(ユーザー向け) ----------
  form.addPageBreakItem()
    .setTitle('セクション3:今後追加を検討している機能(ユーザー向け)')
    .setHelpText('以下は現在検討中の機能です。「あったら使いたいか」を教えてください。');

  var planned = [
    '複数人で店を選ぶとき、候補に「いいね」をつけて投票できる(1人1店舗のみ)',
    'アレルギーの重症度や詳細を選べる(例:除去すれば食べられる、同じ調理場もNG)',
    'お店のアレルギー対応力が、バッジなどで見える化される',
    'このサイト上で予約まで完結できる',
    '予約時に、来店者全員の食べられないものがお店に自動で伝わる',
    '予約時に、席(カウンター・テーブル、禁煙・喫煙など)を指定できる',
    '店内を360度見て、希望の席を選んで予約できる',
    '利用シチュエーション(デート、家族、会食など)でも店を検索できる'
  ];

  addScaleQuestions(form, 'Q8', planned, SCALE_USE, '【あったら使いたいか】', true);

  form.addCheckboxItem()
    .setTitle('Q9. Q8の中で、特に実現してほしい機能を最大3つまで選んでください')
    .setChoiceValues(planned)
    .setValidation(
      FormApp.createCheckboxValidation()
        .setHelpText('3つまで選んでください')
        .requireSelectAtMost(3)
        .build())
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Q10. 投票機能がある場合、名前の表示はどちらが良いですか')
    .setChoiceValues(['匿名', '記名', '投票ごとに選べるのが良い', 'どちらでもよい'])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Q11. その他、こんな機能があったら使いたいというアイデアがあれば教えてください')
    .setRequired(false);

  // ---------- セクション4:飲食店向けの機能 ----------
  form.addPageBreakItem()
    .setTitle('セクション4:飲食店向けの機能について')
    .setHelpText('このセクションは、飲食店の経営・勤務者の方にお聞きします。該当しない方は、そのまま「送信」へ進んでください。');

  addScaleQuestions(form, 'Q12', [
    'レシートやメニューの画像から食材を読み取って、登録を補助してくれる(最終確認は人が行う)',
    'メニューごとの使用食材に加えて、どこまで柔軟に対応できるか(除去可、別調理可など)を登録できる',
    '登録情報から、アレルギー対応表が自動で作成される',
    '予約時に、来店者全員のアレルギー・食べられないもの情報を受け取れる',
    'お店の対応力や情報量が、バッジとして表示される',
    'お客様との確認や連絡を、AIが代わりに行ってくれる(電話対応の軽減)'
  ], SCALE_USE, '【使いたいか】', false);

  form.addMultipleChoiceItem()
    .setTitle('Q13. 現在、アレルギー対応についてお客様からの問い合わせはありますか')
    .setChoiceValues(['よくある', 'たまにある', 'ほとんどない', 'ない'])
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('Q14. アレルギー対応でお困りのことは何ですか')
    .setChoiceValues([
      '食材の情報整理に手間がかかる',
      '電話での問い合わせ対応が負担',
      '予約時にお客様の情報が十分にわからない',
      '対応の可否の判断が難しい',
      '特に困っていない'
    ])
    .showOtherOption(true)
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Q15. 次のようなプランがあった場合、どちらを利用したいですか\n' +
      '【無料プラン】掲載・予約メールのみ、食材は手入力\n' +
      '【有料プラン】アレルゲン表の作成、予約時のアレルギー情報の受け取り、レシートやメニュー表からの食材入力補助、対応力バッジ')
    .setChoiceValues(['無料プランを利用したい', '有料プランを利用したい', '内容や料金次第', 'どちらも利用しない'])
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Q16. 有料プランの場合、月額いくらまでなら利用したいと思いますか')
    .setChoiceValues(['0円(利用しない)', '1,000円未満', '1,000〜3,000円', '3,000〜5,000円', '5,000円以上'])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Q17. 飲食店向け機能について、ご意見やご要望があれば教えてください')
    .setRequired(false);

  form.setConfirmationMessage('ご協力ありがとうございました。');

  Logger.log('編集用URL: ' + form.getEditUrl());
  Logger.log('回答用URL: ' + form.getPublishedUrl());
}

/**
 * 機能ごとに1問ずつの選択式(ラジオボタン)を作る。
 * 質問文が横長に表示され、選択肢はその下に縦に並ぶ。
 */
function addScaleQuestions(form, prefix, features, scale, label, required) {
  for (var i = 0; i < features.length; i++) {
    form.addMultipleChoiceItem()
      .setTitle(prefix + '-' + (i + 1) + '. ' + features[i])
      .setHelpText(label)
      .setChoiceValues(scale)
      .setRequired(required);
  }
}
