import { env } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import { checkHeader, newFetchParams, newParseParams } from '../src/params'

// Notion APIを叩かないのでモックにする（読み込みに伴うcjsからの変換エラー回避でもある）
vi.mock('@notionhq/client', () => {
	return {}
})

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

describe('checkHeader', () => {
	it('すべての対応パラメータを渡す', () => {
		env.WORKER_SECRET = 'dummy-secret'

		const request = new IncomingRequest('https://example.com')
		request.headers.append('Authorization', 'Bearer dummy-token')
		request.headers.append('x-secret', 'dummy-secret')

		const token = checkHeader(request, env)
		if (typeof token !== 'string') {
			expect.fail()
		}

		expect(token).equal('dummy-token')
	})

	describe('Authorization', () => {
		it('Authorizationが「Bearer value」の形式でなければ401が返ってくること', () => {
			env.WORKER_SECRET = 'dummy-secret'

			const request = new IncomingRequest('https://example.com')
			request.headers.append('Authorization', 'Bearer')
			request.headers.append('x-secret', 'dummy-secret')

			const token = checkHeader(request, env)
			if (!(token instanceof Response)) {
				expect.fail()
			}

			expect(token.status).equal(401)
		})

		it('Authorizationが存在しない場合、401が返ってくること', () => {
			env.WORKER_SECRET = 'dummy-secret'

			const request = new IncomingRequest('https://example.com')
			request.headers.append('x-secret', 'dummy-secret')

			const token = checkHeader(request, env)
			if (!(token instanceof Response)) {
				expect.fail()
			}

			expect(token.status).equal(401)
		})
	})

	describe('env.WORKER_SECRET', () => {
		it('env.WORKER_SECRETが空の場合、x-secretを渡さなくてもtokenが返ってくること', () => {
			env.WORKER_SECRET = ''

			const request = new IncomingRequest('https://example.com')
			request.headers.append('Authorization', 'Bearer dummy-token')

			const token = checkHeader(request, env)
			if (typeof token !== 'string') {
				expect.fail()
			}

			expect(token).equal('dummy-token')
		})

		it('env.WORKER_SECRETによるガードが効いていること', () => {
			env.WORKER_SECRET = 'dummy-secret'

			const request = new IncomingRequest('https://example.com')
			// env.WORKER_SECRETが設定されている状態でx-secretを渡さない
			request.headers.append('Authorization', 'Bearer dummy')

			const token = checkHeader(request, env)
			if (!(token instanceof Response)) {
				expect.fail()
			}

			expect(token.status).equal(401)
		})
	})
})

describe('newFetchParams', () => {
	it('すべての対応パラメータを渡す', () => {
		const url = new URL('https://example.com')
		url.searchParams.set('database_id', 'dummy-database-id')
		url.searchParams.set('indent', '')
		url.searchParams.set('date', '2025-01-01')
		url.searchParams.set('to_date', '2025-01-02')

		const request = new IncomingRequest(url.href)
		const params = newFetchParams(request, env)
		if (params instanceof Response) {
			expect.fail()
		}

		expect(params.databaseId).equal('dummy-database-id')
		expect(params.date).equal('2025-01-01')
		expect(params.toDate).equal('2025-01-02')
	})

	describe('env', () => {
		it('未設定の場合の初期値を確認する', () => {
			env.TZ = ''
			env.DATE_PROPERTY_NAME = ''

			const url = new URL('https://example.com')
			url.searchParams.set('database_id', 'dummy-database-id')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (params instanceof Response) {
				expect.fail()
			}

			expect(params.databaseId).equal('dummy-database-id')
			expect(params.tz).equal('Asia/Tokyo')
			expect(params.datePropertyName).equal('作成日時')
		})

		it('設定されている場合は反映されること', () => {
			env.TZ = 'UTC'
			env.DATE_PROPERTY_NAME = 'created_at'

			const url = new URL('https://example.com')
			url.searchParams.set('database_id', 'dummy-database-id')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (params instanceof Response) {
				expect.fail()
			}

			expect(params.databaseId).equal('dummy-database-id')
			expect(params.tz).equal('UTC')
			expect(params.datePropertyName).equal('created_at')
		})
	})

	describe('database_id', () => {
		it('database_idを渡さない場合は400が返ってくること', () => {
			const url = new URL('https://example.com')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (!(params instanceof Response)) {
				expect.fail()
			}

			expect(params.status).equal(400)
		})

		it('database_idの値が空の場合は400が返ってくること', () => {
			const url = new URL('https://example.com')
			url.searchParams.set('database_id', '')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (!(params instanceof Response)) {
				expect.fail()
			}

			expect(params.status).equal(400)
		})
	})

	describe('date', () => {
		it('date, to_dateが空の場合、実行日になること', () => {
			const url = new URL('https://example.com')
			url.searchParams.set('database_id', 'dummy-database-id')
			url.searchParams.set('date', '')
			url.searchParams.set('to_date', '')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (params instanceof Response) {
				expect.fail()
			}

			expect(params.databaseId).equal('dummy-database-id')

			const today = new Date().toISOString().split('T')[0]
			expect(params.date).equal(today)
			expect(params.toDate).equal(today)
		})

		it('date, to_dateが渡されない場合は、実行日になること', () => {
			const url = new URL('https://example.com')
			url.searchParams.set('database_id', 'dummy-database-id')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (params instanceof Response) {
				expect.fail()
			}

			expect(params.databaseId).equal('dummy-database-id')

			const today = new Date().toISOString().split('T')[0]
			expect(params.date).equal(today)
			expect(params.toDate).equal(today)
		})

		it('dateだけ渡された場合、to_dateはdateの日付になること', () => {
			const url = new URL('https://example.com')
			url.searchParams.set('database_id', 'dummy-database-id')
			url.searchParams.set('date', '2025-01-01')

			const request = new IncomingRequest(url.href)
			const params = newFetchParams(request, env)
			if (params instanceof Response) {
				expect.fail()
			}

			expect(params.databaseId).equal('dummy-database-id')

			expect(params.date).equal('2025-01-01')
			expect(params.toDate).equal('2025-01-01')
		})
	})
})

describe('newParseParams', () => {
	it('すべての対応パラメータを渡す', () => {
		const url = new URL('https://example.com')
		url.searchParams.set('indent', '')
		url.searchParams.set('date_heading', '')

		const request = new IncomingRequest(url.href)
		const params = newParseParams(request, env)

		expect(params.indent).equal(true)
		expect(params.dateHeading).equal(true)
	})

	describe('env', () => {
		it('未設定の場合の初期値を確認する', () => {
			env.TZ = ''

			const url = new URL('https://example.com')

			const request = new IncomingRequest(url.href)
			const params = newParseParams(request, env)

			expect(params.tz).equal('Asia/Tokyo')
		})

		it('設定されている場合は反映されること', () => {
			env.TZ = 'UTC'

			const url = new URL('https://example.com')

			const request = new IncomingRequest(url.href)
			const params = newParseParams(request, env)

			expect(params.tz).equal('UTC')
		})
	})

	it('booleanなパラメーターを渡さない場合はfalseとなること', () => {
		const url = new URL('https://example.com')

		const request = new IncomingRequest(url.href)
		const params = newParseParams(request, env)

		expect(params.indent).equal(false)
		expect(params.dateHeading).equal(false)
	})
})
