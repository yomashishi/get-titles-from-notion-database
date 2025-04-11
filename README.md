# get-title-for-1day-from-notion-database

Notionのデータベースから1日分のタイトルを取得するやつ。
Cloudflare Workers向けに実装しています。

```shell
curl -H 'Authorization: Bearer {YOUR_NOTION_API_TOKEN}' \
	'https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}'
```

## 機能

### 日付指定

URLに `date` パラメータを `YYYY-MM-DD` 形式で指定すると、その日の情報を取得できます。

`https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&date=2025-04-10`

### 認証

環境変数に `WORKER_SECRET` が設定されている場合、リクエストヘッダに `x-secret: {YOUR_WORKER_SECRET}` を付与しないと利用できないように設定できます。
