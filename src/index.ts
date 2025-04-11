import { Client, isFullPage } from '@notionhq/client'
import type { SearchResponse } from '@notionhq/client/build/src/api-endpoints'
import { formatInTimeZone } from 'date-fns-tz'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const tz = env.TZ || 'Asia/Tokyo'
		const datePropertyName = env.DATE_PROPERTY_NAME || '作成日時'

		const authorization = request.headers.get('authorization')
		if (!authorization || !authorization.startsWith('Bearer ')) {
			return new Response('Unauthorized', { status: 401 })
		}
		const token = authorization.split(' ')[1]
		const notion = new Client({ auth: token })

		const { searchParams } = new URL(request.url)
		// TODO: dateがYYYY-MM-DD形式かどうかを事前に検査する
		const dateQuery = searchParams.get('date') ?? new Date().toISOString()
		const searchDate = formatInTimeZone(dateQuery, tz, 'yyyy-MM-dd')

		const databaseId = searchParams.get('database_id')
		if (!databaseId) {
			return new Response('Missing database_id', { status: 400 })
		}

		try {
			const response = await action(
				notion,
				databaseId,
				datePropertyName,
				searchDate,
			)
			return new Response(response)
		} catch (error) {
			console.error('Error fetching pages:', error)
			return new Response('Failed to fetch pages', { status: 500 })
		}
	},
} satisfies ExportedHandler<Env>

async function action(
	notion: Client,
	databaseId: string,
	datePropertyName: string,
	searchDate: string,
): Promise<string> {
	const response = await notion.databases.query({
		database_id: databaseId,
		filter: {
			property: datePropertyName,
			date: {
				equals: searchDate,
			},
		},
		sorts: [
			{
				property: datePropertyName,
				direction: 'ascending',
			}
		]
	})

	const titles = getTitles(response)
	const titlesWithListNotation = titles.map(title => `- ${title}`)

	return `${titlesWithListNotation.join('\n')}\n`
}

function getTitles(response: SearchResponse): string[] {
	const titles: string[] = []
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
			const title = richText.plain_text.split('\n')
			titles.push(...title)
		}
	}
	return titles
}
