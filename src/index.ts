import { Client } from '@notionhq/client'
import { checkHeader, newFetchParams, newParseParams } from './params'
import { fetchTitlesAsMarkdownList } from './notion'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const notionToken = checkHeader(request, env)
		if (notionToken instanceof Response) {
			// Response 401
			return notionToken
		}

		const fetchParams = newFetchParams(request, env)
		if (fetchParams instanceof Response) {
			return fetchParams
		}

		const parseParams = newParseParams(request, env)

		const notion = new Client({ auth: notionToken })
		try {
			const response = await fetchTitlesAsMarkdownList(notion, fetchParams, parseParams)
			return new Response(response)
		} catch (error) {
			console.error('Error fetching pages:', error)
			return new Response('Failed to fetch pages', { status: 500 })
		}
	},
} satisfies ExportedHandler<Env>
