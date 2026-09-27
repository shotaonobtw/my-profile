# 音楽おみくじ

自分のSpotify Premiumで使う、30曲から今日の一曲と創作の運勢を引くReactアプリ。
クラシック・洋楽・J-popを10曲ずつ収録。ジャンルを選べます。同じ曲は連続しません。

## 起動

このREADMEがある `week16-music-omikuji` フォルダで実行します。

```sh
pnpm install
pnpm run dev
```

Chromeで http://127.0.0.1:5173/ を開きます。Spotify開発画面のRedirect URIもこのURLと一致させます。
ポート5173が使用中の場合は、別の開発サーバーを停止してください。自動で別ポートに変えない設定です。

1. Spotifyに接続し、本人が許可操作を行う。
2. 「再生準備ができました」を待つ。
3. ジャンルを選び「今日のおみくじを引く」を押す。
4. 運勢が表示され、抽選された曲の再生を要求する。
5. 再生できない場合はエラー文を確認。同じ曲の再試行、一時停止・再開、Spotifyで開く操作ができます。

接続前でも占いは使えます。接続前に引いた結果はログインのページ移動で消えます。
全30曲を本人のアカウントで再生できるかは未確認です。地域・配信状況によって再生できない音源があります。

## ビルドと確認

```sh
pnpm run build
pnpm run lint
pnpm run preview
```

`dist/` が生成されます。開発サーバーとプレビューは同じポートなので、同時に起動しないでください。

2026-09-27 の確認結果:
- 本人がChromeで接続テスト版の1曲再生に成功したと報告。
- 30曲版のbuild・lint成功。
- 自動検証: 30個の固有ID・ジャンルごと10曲・全候補に当たること・乱数の先頭/末尾・直前曲の除外・不明なジャンル。
- アプリ内ブラウザ: 未接続でジャンル選択、抽選、連続抽選、出典と曲リンクの表示を確認。
- 375px / 1280px: 横はみ出しなし。スマホは縦並び、PCは2列。
- 30曲版の本人環境での再生・再試行・一時停止は確認待ち。GitHub Pages公開は未実施。

## 仕組みを説明する順番

1. `src/songs.js`: 配列に30曲を保存。曲ごとにID、ジャンル、Spotify ID、創作の運勢、出典を持つ。
2. `src/lottery.js`: `filter`でジャンルと直前の曲を判定。`Math.random`と`Math.floor`で候補の番号を選ぶ。
3. `src/App.jsx`: `genre`が選択中ジャンル、`selected`が引いた曲。`setSelected(next)`で結果表示が変わる。
4. `playSelected`: 準備済みのSpotifyに曲のIDを送る。`try/catch/finally`で失敗を表示し、ボタンの処理中状態を解除。
5. `useEffect`: Spotifyプレーヤーを作り、準備・再生・エラーのイベントを受け取る。終了時は接続を解除。
6. `src/spotify.js`: PKCE認証、トークン更新、Spotifyへの再生リクエスト。Client Secretは使わない。

`useState`は画面に反映する値、`useRef`はプレーヤー本体や連打防止の即時フラグを保持します。
認証部分は少し難しいので、理解できない関数を一つずつ質問してから提出してください。
「自分がすべて説明できる」は、実際に説明できた後にPRへ記載します。

## 占いと出典

占いは制作時にAIと作った固定の創作文です。実行時のAI API呼び出しはありません。
曲名・背景から連想した励ましで、歌詞の転載やアーティスト本人の公式解釈ではありません。
曲・演奏者はSpotify掲載情報を調査。制作時の確認元は各曲の `source` に記録しています。画面の背景・出典欄は削除しました。
SNSの感想を曲の歴史的事実として扱っていません。

## 認証と公開

Client IDは公開の識別子です。Client Secret・パスワードはコードに入れません。
トークンはタブ単位のsessionStorageに保存し、Consoleやリポジトリには出しません。
開発モードの利用者制限に該当する場合はSpotify開発画面のUser Managementを確認してください。

`base: './'`は設定済みですが、公開するにはホスティングの設定も必要です。
公開先のHTTPS URLをSpotifyのRedirect URIにも追加します。ローカルURLを追加しただけでは公開先で認証できません。

公式資料:
- https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- https://developer.spotify.com/documentation/web-playback-sdk
- https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback

## 外観の更新
淡い青を約6割・桃色を約4割にしたCSSグラデーション。抽選後はカードが1秒間に20回転（7200度）→虹0.9秒→金の額縁0.4秒。動きを減らす設定では演出を省略します。

30曲版の追加検証: build・lint成功。30曲の重複なし、各ジャンル10曲、乱数の両端と全候補を確認。375px・1280pxで横はみ出しなし。スマホで結果へ移動、虹の表示と金の額縁での停止、演出後の再抽選ボタン復帰を確認。全音源の実再生は未確認。
