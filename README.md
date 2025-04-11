# get-title-for-1day-from-notion-database

Notionのデータベースから1日分のタイトルを取得するやつ。
Cloudflare Workers向けに実装しています。

```shell
curl -H 'Authorization: Bearer {YOUR_NOTION_API_TOKEN}' \
	'https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}'
```

URLに `date` パラメータを `YYYY-MM-DD` 形式で指定すると、その日の情報を取得できます。

`https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&date=2025-04-10`
