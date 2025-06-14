import { Client, isFullPage } from '@notionhq/client'
import type { SearchResponse } from '@notionhq/client/build/src/api-endpoints'
import { formatInTimeZone } from 'date-fns-tz'

interface RequestParams {
	token: string
	databaseId: string
	searchDate: string
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const tz = env.TZ || 'Asia/Tokyo'
		const datePropertyName = env.DATE_PROPERTY_NAME || '作成日時'

		const validationResult = validateRequest(request, env)
        if (validationResult instanceof Response) {
            return validationResult
        }
		const { token, databaseId, searchDate } = validationResult

		const notion = new Client({ auth: token })
		try {
			const response = await fetchTitlesByDate(
				notion,
				databaseId,
				datePropertyName,
				searchDate,
				tz,
			)
			return new Response(response)
		} catch (error) {
			console.error('Error fetching pages:', error)
			return new Response('Failed to fetch pages', { status: 500 })
		}
	},
} satisfies ExportedHandler<Env>

async function fetchTitlesByDate(
	notion: Client,
	databaseId: string,
	datePropertyName: string,
	searchDate: string,
	tz: string,
): Promise<string> {
	// ISO8601 format
	const startDate = formatInTimeZone(searchDate, tz, 'yyyy-MM-dd\'T\'00:00:00XXX')
	const endDate = formatInTimeZone(searchDate, tz, 'yyyy-MM-dd\'T\'23:59:59XXX')

	const response = await notion.databases.query({
		database_id: databaseId,
		filter: {
			and: [
				{
					property: datePropertyName,
					date: {
						after: startDate,
					},
				},
				{
					property: datePropertyName,
					date: {
						before: endDate,
					},
				}
			]
		},
		sorts: [
			{
				property: datePropertyName,
				direction: 'ascending',
			}
		]
	})

	const titleLinesWithListNotation = getTitleLinesWithListNotation(response)

	return `${titleLinesWithListNotation.join('\n')}\n`
}

function getTitleLinesWithListNotation(response: SearchResponse): string[] {
	const titleLinesWithListNotation: string[] = []
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
			const titleLines = richText.plain_text.split('\n')

			const titleLinesWithListNotationByPage = titleLines.map((title, index) => {
				const line = `- ${title.trim()}`
				if (index === 0) {
					return line
				}

				// 2行目以降はインデントをつける
				return ' '.repeat(4) + line
			})

			titleLinesWithListNotation.push(...titleLinesWithListNotationByPage)
		}

	}
	return titleLinesWithListNotation
}

function validateRequest(request: Request, env: Env): RequestParams | Response {
    if (env.WORKER_SECRET && request.headers.get('x-secret') !== env.WORKER_SECRET) {
        return new Response('Unauthorized', { status: 401 })
    }

    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 })
    }
    const token = authorization.split(' ')[1]

    const { searchParams } = new URL(request.url)

    const searchDate = searchParams.get('date') ?? new Date().toISOString()
    const databaseId = searchParams.get('database_id')
    if (!databaseId) {
        return new Response('Missing database_id', { status: 400 })
    }

	const requestParams: RequestParams = {
		token,
		databaseId,
		searchDate
	}
    return requestParams
}