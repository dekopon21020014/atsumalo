# あつま郎
```
-----------------------------------------------------------------------
   ##     ######    #####   ##   ##  ##   ##    ##     ####      #####
  ####    # ## #   ##   ##  ##   ##  ### ###   ####     ##      ##   ##
 ##  ##     ##     #        ##   ##  #######  ##  ##    ##      ##   ##
 ##  ##     ##      #####   ##   ##  #######  ##  ##    ##      ##   ##
 ######     ##          ##  ##   ##  ## # ##  ######    ##   #  ##   ##
 ##  ##     ##     ##   ##  ##   ##  ##   ##  ##  ##    ##  ##  ##   ##
 ##  ##    ####     #####    #####   ##   ##  ##  ##   #######   #####
-----------------------------------------------------------------------
```
研究室内の機器や実験室の利用状況をオンラインで一元管理するためのスケジューリングツールです。
メンバーは共有カレンダーで空き時間を確認し、実験やミーティングの予約を簡単に行えます。
管理者は設備やユーザーの権限を管理し、予約の承認や利用状況の把握ができます。

## 主な機能
- 予約カレンダーでの設備・部屋の空き状況確認と予約
- メンバーごとの予約履歴・通知機能
- 管理者による設備・ユーザー管理
- Next.js 15 と React 19 を使用した高速なUI
- Tailwind CSS によるレスポンシブなスタイリング
- Firebase を利用した認証とリアルタイムデータ管理

## 必要要件
- Node.js 18 以上
- Yarn

## セットアップ
環境変数ファイルを作成します。
```bash
cp .env.example .env
# 必要に応じて .env の値を編集
```

## Vercel での Cron ジョブ設定
本番環境では Vercel の Cron Job を利用して `DELETE_OLD_EVENTS_CRON_SECRET` をヘッダーに埋め込み、`/api/cron/delete-old-events` が Vercel からのリクエストだけを受け付けるようにしています。

1. Vercel のプロジェクトにシークレットを登録します。
   ```bash
   vercel env add delete_old_events_cron_secret production
   vercel env add delete_old_events_cron_secret preview
   ```
2. `vercel.json` は上記シークレットを `DELETE_OLD_EVENTS_CRON_SECRET` という環境変数と `x-cron-secret` ヘッダーの両方に差し込みます。ローカル開発では `.env` に同じ値を設定してください。

シークレット名（`delete_old_events_cron_secret`）と環境変数名（`DELETE_OLD_EVENTS_CRON_SECRET`）の両方を変更した場合は `vercel.json` も忘れずに更新してください。

### Vercel で `delete_old_events_cron_secret` が見つからないと言われたら？

Vercel のデプロイログに次のようなエラーが表示される場合があります。

```
Environment Variable "DELETE_OLD_EVENTS_CRON_SECRET" references Secret "delete_old_events_cron_secret", which does not exist.
```

このメッセージは `vercel.json` の `env` と `crons.headers` で参照しているシークレット `@delete_old_events_cron_secret` が Vercel プロジェクトに登録されていないことを意味します。以下の手順で解決できます。

1. Vercel CLI で `vercel env add delete_old_events_cron_secret production` と `vercel env add delete_old_events_cron_secret preview` を実行し、Cron 用のシークレットを追加する。
2. ローカル開発でも `.env` に `DELETE_OLD_EVENTS_CRON_SECRET=...` を追記し、`app/api/cron/delete-old-events/route.ts` が同じ値を参照できるようにする。
3. 既に別名のシークレットを使いたい場合は、`vercel.json` 内の `@delete_old_events_cron_secret` と環境変数名の双方を同じ名前に揃える。

上記を設定すれば、Cron API の認証に必要なシークレットが正しく展開され、デプロイ時のエラーも解消されます。

```bash
yarn install
```

## 開発サーバーの起動
```bash
yarn dev
```
ブラウザで http://localhost:3000 を開くとアプリを確認できます。

## ビルド
```bash
yarn build
```

## プロダクション起動
```bash
yarn start
```

## Lint とテスト
```bash
yarn lint
yarn test
```

## その他
英語版の README は [README.en.md](README.en.md) を参照してください。
