import cookie, { type SetCookie } from 'cookie'

import { getCache, mergeCache } from '../caches/al.ts'
import { ANIMEOFFLINEDB_URL } from '../constants.ts'
import { AnimeItem } from '../models/animeitem.ts'

async function getData () {
  const response = await fetch(ANIMEOFFLINEDB_URL)
  return await response.json() as { data: Array<{ sources: string[], tags: string[], type: string }>}
}

const ADULT_TAGS = ['adult', 'ecchi', 'doujin', 'hentai', 'porn', 'erotica', 'yaoi', 'yuri']

export async function generateListAOD () {
  const { data } = await getData()
  const alCache = await getCache()
  const adult: AnimeItem[] = []
  const items = data.map(i => {
    const item = AnimeItem.fromAODBSourceUrls(i.sources)
    item.type = i.type
    const isAdult = !item.anilist_id && item.mal_id && (ADULT_TAGS.some(adult => i.tags.some(tag => tag.toLowerCase().includes(adult))) || (item.tvdb_id ?? item.anidb_id))
    if (isAdult && item.mal_id) {
      if (alCache[item.mal_id.toString()]) {
        item.anilist_id = alCache[item.mal_id.toString()]
      } else {
        adult.push(item)
      }
    }
    return item
  })
  const malIDs = adult.map(i => i.mal_id!)

  const compound = await malIdsCompound(malIDs)

  await mergeCache(compound)

  for (const item of adult) {
    if (item.mal_id != null && compound[item.mal_id] != null) {
      item.anilist_id = compound[item.mal_id]
    }
  }

  return items
}

let sess: SetCookie | undefined
let token: string | undefined

async function getCookie () {
  if (sess && token && sess.expires! >= new Date()) return { sess, token }

  const res = await fetch('https://anilist.co/')

  const cookieObj = cookie.parseSetCookie(res.headers.get('set-cookie') ?? '')

  const body = await res.text()

  token = /window\.al_token = "([^"]+)"/.exec(body)?.[1]

  if (!token || cookieObj.name !== 'laravel_session') throw new Error('Failed to retrieve token or session cookie')

  sess = cookieObj

  return { sess, token }
}

async function alqueryinternal (query: string, variables: Record<string, unknown>) {
  const { sess, token } = await getCookie()
  const response = await fetch('https://anilist.co/graphql', {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-csrf-token': token,
      Cookie: `${sess.name}=${sess.value}`
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  return await response.json()
}

async function alquery (query: string, variables: Record<string, unknown>) {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  return await response.json()
}

async function malIdsCompound (ids: number[]) {
  if (!ids.length) return {}

  // chunk every 50
  let fragmentQueries = ''

  for (let i = 0; i < ids.length; i += 50) {
    fragmentQueries += /* gql */`
      v${i}: Page(perPage: 50, page: ${Math.floor(i / 50) + 1}) {
        media(idMal_in: $ids, type: ANIME) {
          ...med
        }
      },
      `
  }

  const query = /* gql */`
    query($ids: [Int]) {
      ${fragmentQueries}
    }
    
    fragment med on Media {
      id,
      idMal
    }`

  let res: { data?: Record<string, { media: Array<{ id: number, idMal: number }>}>, errors?: Array<{ status?: number }> } = await alquery(query, { ids })

  if (res.errors?.[0]?.status === 403) res = await alqueryinternal(query, { ids })

  return Object.fromEntries(Object.values(res.data ?? {}).flatMap(({ media }) => media).map(media => [media.idMal, media.id]))
}
