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
Vercel の Cron Jobs は、プロジェクトの環境変数に `CRON_TOKEN` を設定すると、Cron が API を呼び出す際に `authorization` ヘッダーへ自動で同じトークンを挿入してくれます。本番環境の `/api/cron/delete-old-events` はこの仕組みを利用し、Vercel の Cron からのリクエストだけを受け付けるようにしています。

1. Vercel のプロジェクトに `CRON_TOKEN` を登録します。既に Vercel のダッシュボードで `CRON_TOKEN` を設定済みであればそのまま利用できます。
   ```bash
   # 新規で登録する場合の例（Secret として登録し、環境変数へ割り当てる）
   vercel secrets add CRON_TOKEN <your-cron-token>
   ```
2. `vercel.json` では Cron のスケジュールのみを設定します。`CRON_TOKEN` は Vercel 側でヘッダーへ挿入されるため、追加のヘッダー指定は不要です。
3. ローカル開発でも `.env` に `CRON_TOKEN=...` を追加し、`app/api/cron/delete-old-events/route.ts` が同じ値を参照できるようにしてください。

`CRON_TOKEN` を更新した場合は、Vercel の環境変数と `.env` の両方を忘れずに入れ替えてください。

### Vercel で `CRON_TOKEN` に関するエラーが出たら？

`/api/cron/delete-old-events` のログに `CRON_TOKEN is not configured` や `Unauthorized request` が出力される場合は、以下を確認してください。

1. Vercel のプロジェクトに `CRON_TOKEN` が設定されているか（Secret を利用する場合は `vercel secrets add CRON_TOKEN ...` を実行した後、Environment Variables で参照する）。
2. `vercel.json` の Cron 設定が正しいパス（`/api/cron/delete-old-events`）を指しているか。
3. ローカル開発中に Cron API を叩く場合は `.env` の `CRON_TOKEN` と `Authorization` ヘッダーの値が一致しているか。

上記を満たせば、Cron API の認証が正しく行われ、Vercel からのみジョブが実行されるようになります。

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
