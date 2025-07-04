export interface FetchParams {
	tz: string
	datePropertyName: string
	databaseId: string
	date: string
	toDate: string
	indent: boolean
}

/**
 * ヘッダーをチェックしてNotionのtokenを返却する
 * 不備があれば401レスポンスを返却する
 */
export function checkHeader(request: Request, env: Env): string | Response {
	if (env.WORKER_SECRET && request.headers.get('x-secret') !== env.WORKER_SECRET) {
		return new Response('Unauthorized', { status: 401 })
	}

	const authorization = request.headers.get('authorization')
	if (!authorization || !authorization.startsWith('Bearer ')) {
		return new Response('Unauthorized', { status: 401 })
	}

	const token = authorization.split(' ')[1]
	return token
}

/**
 * RequestとEnvから、Notion API実行用のパラメーターを生成する
 */
export function newFetchParams(request: Request, env: Env): FetchParams | Response {
	const tz = env.TZ || 'Asia/Tokyo'
	const datePropertyName = env.DATE_PROPERTY_NAME || '作成日時'

	const { searchParams } = new URL(request.url)

	const databaseId = searchParams.get('database_id')
	if (!databaseId) {
		return new Response('Missing database_id', { status: 400 })
	}

	// dateが無ければ実行日を対象とする
	const today = new Date().toISOString().split('T')[0]
	let date = searchParams.get('date')
	if (!date) {
		date = today
	}

	// to_dateが無ければdateの日付までを対象とする
	let toDate = searchParams.get('to_date')
	if (!toDate) {
		toDate = date
	}

	const indent = searchParams.has('indent')

	return {
		tz,
		datePropertyName,
		databaseId,
		date,
		toDate,
		indent,
	} as FetchParams
}