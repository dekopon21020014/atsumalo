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
Vercel の Cron Jobs は、プロジェクトの環境変数に `CRON_SECRET` を設定しておくと Cron 実行時に `authorization` ヘッダーへ `Bearer <CRON_SECRET>` を自動で差し込みます。本番環境の `/api/cron/delete-old-events` でもこの仕組みを利用し、Vercel の Cron からのリクエストだけを受け付けるようにしています。トークンは少なくとも 16 文字以上のランダムな文字列を推奨します。詳しい設定方法は [Vercel 公式ドキュメント](https://vercel.com/docs/cron-jobs/manage-cron-jobs) も参照してください。

1. Vercel の「Project Settings > Environment Variables」で `CRON_SECRET` を登録します。既にダッシュボードで同名の環境変数があればそれを利用し、未設定なら直接値を貼り付けるか、必要に応じて `vercel secrets add CRON_SECRET <your-cron-token>` で Secret を作って紐づけます。
2. `vercel.json` には Cron のスケジュールのみを記述します（Vercel のサンプルと同じく `crons` 配列だけで OK）。`CRON_SECRET` は Vercel 側が `authorization` ヘッダーへ挿入するため、追加のヘッダー指定や `env` セクションは不要です。
3. ローカル開発でも `.env` に `CRON_SECRET=...` を追加し、`app/api/cron/delete-old-events/route.ts` が同じ値を参照できるようにしてください。ローカルから Cron API を叩く際は `Authorization: Bearer <CRON_SECRET>` を付与すれば OK です。

`CRON_SECRET` を更新した場合は、Vercel の環境変数と `.env` の両方を忘れずに入れ替えてください。

### Vercel で `CRON_SECRET` に関するエラーが出たら？

`/api/cron/delete-old-events` のログに `CRON_SECRET is not configured` や `Unauthorized request` が出力される場合は、以下を確認してください。

1. Vercel のプロジェクトに `CRON_SECRET` が設定されているか（Secret を利用する場合は `vercel secrets add CRON_SECRET ...` を実行した後、Environment Variables で参照する）。
2. `vercel.json` の Cron 設定が正しいパス（`/api/cron/delete-old-events`）を指しているか。
3. ローカル開発中に Cron API を叩く場合は `.env` の `CRON_SECRET` と `Authorization` ヘッダーの値が一致しているか。

上記を満たせば、Cron API の認証が正しく行われ、Vercel からのみジョブが実行されるようになります。

### 「Environment Variable "CRON_SECRET" references Secret "CRON_SECRET", which does not exist.」と表示されたら？

このエラーは、環境変数の値に `@CRON_SECRET` のような Secret 参照を指定しているのに、Vercel 側で同名の Secret をまだ登録していない場合に発生します。今回のように `vercel.json` を Cron スケジュールだけにしておけば、そもそも `@CRON_SECRET` を書かなくても済むのでエラーを避けられます。

1. 既に `@CRON_SECRET` を利用している場合は、`vercel secrets add CRON_SECRET <your-cron-token>` で Secret を作るか、環境変数の値をプレーンなトークン文字列に変更してください。
2. もう一度デプロイすると、作成した Secret か直接入力した値が読み込まれるためエラーは解消されます。

Secret を一度作成してしまえば、その後は同じ名前の Secret を再利用できるので、環境変数の値を変更する際も `vercel secrets rm` → `add` の手順だけで安全に更新できます。

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
