import { getCache, mergeCache } from '../caches/al.ts'
import { ANIMEOFFLINEDB_URL } from '../constants.ts'
import { AnimeItem } from '../models/animeitem.ts'

async function getData () {
  const response = await fetch(ANIMEOFFLINEDB_URL)
  return await response.json() as { data: Array<{ sources: string[], tags: string[], type: string }>}
}

export async function generateListAOD () {
  const { data } = await getData()
  const alCache = await getCache()
  const adult: AnimeItem[] = []
  const items = data.map(i => {
    const item = AnimeItem.fromAODBSourceUrls(i.sources)
    item.type = i.type
    const isAdult = i.tags.includes('adult audience only') || (!item.anilist_id && (item.tvdb_id ?? item.anidb_id))
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

  const res: { data?: Record<string, { media: Array<{ id: number, idMal: number }>}> } = await alquery(query, { ids })

  return Object.fromEntries(Object.values(res.data ?? {}).flatMap(({ media }) => media).map(media => [media.idMal, media.id]))
}
