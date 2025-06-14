# get-title-for-1day-from-notion-database

Notionのデータベースから1日分のタイトルを取得するやつ。
Cloudflare Workers向けに実装しています。

以下の運用をしているデータベースを想定しています。

[Notionで運用するSNSライクな「つぶやき帳」｜こにゃ](https://note.com/ko_nyaku/n/nad80c3c570dd)

## 使い方

Notion APIと同じ要領でヘッダーにトークンを渡してリクエストを実行します。
データベースの指定はクエリパラメーターで行います。

```shell
curl -H 'Authorization: Bearer {YOUR_NOTION_API_TOKEN}' \
	'https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}'
```

## 機能

### 日付指定

URLに `date` パラメータを `YYYY-MM-DD` 形式で指定すると、その日の情報を取得できます。

`https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&date=2025-04-10`

### 認証

Cloudflare Workersの環境変数に `WORKER_SECRET` が設定されている場合、リクエストヘッダに `x-secret: {YOUR_WORKER_SECRET}` を付与しないと利用できないように設定できます。

```shell
npx wrangler secret put WORKER_SECRET
```
