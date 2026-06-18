# 家事らくキッチン

献立・在庫・買い物リスト・家族リクエストをまとめた、スマホ向けの静的 Web アプリです。

## ローカル利用

1. `index.html` をブラウザで開く
2. 家にある食材をタップする
3. 献立カードから一つ選ぶ
4. 不足分が買い物リストに入る

入力内容は `localStorage` に保存されます。

## 公開向けに入っているもの

- `manifest.webmanifest`
  ホーム画面追加用の設定
- `sw.js`
  オフライン表示用の service worker
- `icons/`
  PWA アイコン
- `api/meal-suggestions.js`
  OpenAI を呼ぶサーバー関数
- `.env.example`
  AI機能用の環境変数例

## 公開方法

このアプリは静的ファイルだけで動くので、`Netlify`、`Vercel`、`GitHub Pages` などにそのまま置けます。

### いちばん簡単

1. `kajiraku-app` フォルダを GitHub に置く
2. Vercel に接続する
3. ビルドコマンドなし、公開フォルダを `/` にする
4. 環境変数 `OPENAI_API_KEY` を設定する
5. 必要なら `OPENAI_MODEL` を設定する
6. 発行された URL をスマホで開く

### 注意

- `file://` で開いている間は service worker は動きません
- PWA として使うには `https://` の公開 URL が必要です
- 今のデータ保存先は端末ごとの `localStorage` です
- 家族共有を本番運用するなら Firebase や Supabase などのクラウド保存が次の段階です
- AI候補は `OPENAI_API_KEY` を設定した公開環境でのみ本番動作します
