# get-titles-from-notion-database

NotionのデータベースからページタイトルをMarkdownのリスト形式で取得するやつ。
Cloudflare Workers向けに実装しています。

以下の運用をしているデータベースを想定しています。

[Notionで運用するSNSライクな「つぶやき帳」｜こにゃ](https://note.com/ko_nyaku/n/nad80c3c570dd)

## 開発方法

```shell
npm install
npm run dev
```

環境変数を設定したい場合は `.dev.vars.example` から `.dev.vars` を作成します。

```shell
cp .dev.vars.example .dev.vars
```

## 使い方

Notion APIと同じ要領でヘッダーにトークンを渡してリクエストを実行します。
データベースの指定はクエリパラメーターで行います。

```shell
curl -H 'Authorization: Bearer {YOUR_NOTION_API_TOKEN}' \
    'https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}'
```

## 機能

### 複数行のインデント

タイトルが複数行で構成されている場合、URLに `indent` パラメーターを付与すると二行目以降をインデントした状態で返却します。

例: `https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&indent=`

### 日付指定

URLに `date` パラメータを `YYYY-MM-DD` 形式で指定すると、その日の情報を取得できます。

例: `https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&date=2025-04-10`

`to_date` の指定で、範囲取得もできます。

例: `https://{CLOUDFLARE_WORKERS_ENDPOINT}?database_id={YOUR_DATABASE_ID}&date=2025-04-10&to_date=2025-04-12`

※100件を超えるデータには未対応です。

### 認証

Cloudflare Workersのシークレットに `WORKER_SECRET` が設定されている場合、リクエストヘッダに `x-secret: {YOUR_WORKER_SECRET}` を付与しないと利用できないように設定できます。

ターミナルからの設定方法は以下です。

```shell
npx wrangler secret put WORKER_SECRET
```
