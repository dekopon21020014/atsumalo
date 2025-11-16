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

1. Vercel のシークレットストアに値を登録します（`@delete_old_events_cron_secret` が存在しない場合は以下のコマンドを実行してください）。
   ```bash
   vercel secrets add delete_old_events_cron_secret <your-secret-value>
   ```
   *シークレットは一度登録すれば本番 / プレビューの両方で共有されます。値を更新したい場合は `vercel secrets rm delete_old_events_cron_secret` → `vercel secrets add ...` の順で再登録してください。*
2. `vercel.json` は上記シークレットを `DELETE_OLD_EVENTS_CRON_SECRET` という環境変数と `x-cron-secret` ヘッダーの両方に差し込みます。ローカル開発では `.env` に同じ値を設定してください。デプロイ時に `Environment Variable "DELETE_OLD_EVENTS_CRON_SECRET" references Secret "delete_old_events_cron_secret", which does not exist.` というエラーが出る場合は、上記シークレット登録が完了しているか再度ご確認ください。

シークレット名（`delete_old_events_cron_secret`）と環境変数名（`DELETE_OLD_EVENTS_CRON_SECRET`）の両方を変更した場合は `vercel.json` も忘れずに更新してください。

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
