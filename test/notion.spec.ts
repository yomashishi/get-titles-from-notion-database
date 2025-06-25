import { describe, it, expect, vi } from 'vitest';
import { FetchParams } from '../src/params'
import { newDatabaseQuery } from '../src/notion';

// Notion APIを叩かないのでモックにする（読み込みに伴うcjsからの変換エラー回避でもある）
vi.mock('@notionhq/client', () => {
    return {}
})

describe('newDatabaseQuery', () => {
    const baseFetchParams: FetchParams = {
        databaseId: 'dummy-database-id',
        datePropertyName: '作成日時',
        date: '2025-06-25',
        toDate: '2025-06-26',
        indent: false,
        tz: 'Asia/Tokyo',
    }

    it('filterの時刻がISO8601拡張形式になっていること(Asia/Tokyo)', () => {
        const query = newDatabaseQuery(baseFetchParams)
        expect(query).toEqual({
            database_id: baseFetchParams.databaseId,
            filter: {
                and: [
                    {
                        property: '作成日時',
                        date: {
                            after: '2025-06-25T00:00:00+09:00',
                        },
                    },
                    {
                        property: '作成日時',
                        date: {
                            before: '2025-06-26T23:59:59+09:00',
                        },
                    }
                ]
            },
            sorts: [
                {
                    property: '作成日時',
                    direction: 'ascending',
                }
            ]
        })
    })

    it('filterの時刻がISO8601拡張形式になっていること(UTC)', () => {
        const query = newDatabaseQuery({
            ...baseFetchParams,
            tz: 'UTC'
        })
        expect(query).toEqual({
            database_id: baseFetchParams.databaseId,
            filter: {
                and: [
                    {
                        property: '作成日時',
                        date: {
                            after: '2025-06-25T00:00:00Z',
                        },
                    },
                    {
                        property: '作成日時',
                        date: {
                            before: '2025-06-26T23:59:59Z',
                        },
                    }
                ]
            },
            sorts: [
                {
                    property: '作成日時',
                    direction: 'ascending',
                }
            ]
        })
    })
})
