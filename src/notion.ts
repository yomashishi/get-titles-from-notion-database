import { Client, isFullPage } from "@notionhq/client"
import { FetchParams, ParseParams } from "./params"
import { formatInTimeZone } from "date-fns-tz"
import { QueryDatabaseParameters, SearchParameters, SearchResponse } from "@notionhq/client/build/src/api-endpoints"

export interface NotionPost {
	text: string;
	created_date: string;
}

/**
 * タイトルの一覧をMarkdownのリスト形式で取得する
 */
export async function fetchTitlesAsMarkdownList(notion: Client, fetchParams: FetchParams, parseParams: ParseParams): Promise<string> {
	const queryParams = newDatabaseQuery(fetchParams)
	const response = await notion.databases.query(queryParams)

	const posts = getPostsFromResponse(response)
	return parseToMarkdown(posts, parseParams) + '\n'
}

/**
 * notion.databases.query用のパラメーターを生成する
 */
export function newDatabaseQuery(params: FetchParams): QueryDatabaseParameters {
	// ISO8601拡張形式に変換
	const startDate = formatInTimeZone(params.date, params.tz, 'yyyy-MM-dd\'T\'00:00:00XXX')
	const endDate = formatInTimeZone(params.toDate, params.tz, 'yyyy-MM-dd\'T\'23:59:59XXX')

	return {
		database_id: params.databaseId,
		filter: {
			and: [
				{
					property: params.datePropertyName,
					date: {
						after: startDate,
					},
				},
				{
					property: params.datePropertyName,
					date: {
						before: endDate,
					},
				}
			]
		},
		sorts: [
			{
				property: params.datePropertyName,
				direction: 'ascending',
			}
		]
	} as QueryDatabaseParameters
}

/**
 * SearchResponseから必要なデータを取得する
 */
export function getPostsFromResponse(response: SearchResponse): NotionPost[] {
	const notionPosts: NotionPost[] = []
	for (const page of response.results) {
		if (!isFullPage(page)) {
			continue
		}

		const post = page.properties.post
		if (!post) {
			continue
		}
		if (post.type !== 'title') {
			continue
		}

		for (const richText of post.title) {
			notionPosts.push({
				text: richText.plain_text,
				created_date: page.created_time,
			})
		}

	}
	return notionPosts
}

/**
 * NotionPostの配列をMarkdown文字列に変換する
 */
export function parseToMarkdown(posts: NotionPost[], params: ParseParams): string {
	const titlesAsMarkdownList: string[] = []

	for (const post of posts) {
		const titleLines = post.text.split('\n')

		const titleLinesWithListNotationByPage = titleLines.map((title, index) => {
			const line = `- ${title.trim()}`
			if (index === 0) {
				return line
			}

			// 2行目以降
			if (params.indent) {
				return ' '.repeat(4) + line
			}
			return line
		})

		titlesAsMarkdownList.push(...titleLinesWithListNotationByPage)
	}

	return titlesAsMarkdownList.join('\n')
}
