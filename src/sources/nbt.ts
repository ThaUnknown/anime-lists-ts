import { getCache, mergeCache, type NBTItemData } from '../caches/nbt.ts'
import { AnimeItem } from '../models/animeitem.ts'

export async function generateMappings () {
  const { m, s } = await getCache()
  for await (const { data, offset } of iterate('m', m)) {
    m[`m${offset}`] = {
      tmdbId: data.data?.tmdbId === 0 ? undefined : data.data?.tmdbId,
      imdbId: data.data?.imdbId,
      tvdbId: data.data?.tvdbId
    }
  }
  for await (const { data, offset } of iterate('s', s)) {
    s[`s${offset}`] = {
      tmdbId: data.data?.tmdbId === 0 ? undefined : data.data?.tmdbId,
      imdbId: data.data?.imdbId,
      tvdbId: data.data?.tvdbId
    }
  }
  await mergeCache({ m, s })
  return { m, s }
}

export interface NekoBTResponse {
  error?: boolean
  data?: Data
  message?: string
}

export interface Data {
  title?: string
  year?: number
  genres?: string[]
  overview?: string
  status?: string
  banner_url?: string
  runtime?: number
  tmdbId?: number
  imdbId?: string
  tvdbId?: number
  alternate_titles?: string[]
  notes?: null
  groups?: null
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms).unref())

async function * iterate (prefix: 'm' | 's', cache: Record<string, NBTItemData>) {
  let offset = 1
  let failCount = 0
  while (true) {
    const exists = cache[`${prefix}${offset}`]
    if (exists) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if ((prefix === 'm' && exists.tmdbId) || (prefix === 's' && exists.tvdbId && exists.tmdbId)) {
        ++offset
        continue
      }
    }
    try {
      const response = await fetch(`https://nekobt.to/api/v1/media/${prefix}${offset}?force=true`)
      console.log(`Fetching ${prefix}${offset}`)
      if (response.status === 429) {
        const retry = Number(response.headers.get('Retry-After') ?? (await response.json()).retry_after) + 1
        console.log(`Rate limited, retrying ${prefix}${offset} in ${retry} seconds`)
        await sleep(retry * 1000)
        continue
      }
      const data = await response.json() as NekoBTResponse
      if (data.error && data.message === 'Media not found.') {
        ++failCount
        ++offset
        if (failCount >= 5) {
          console.log(`Finished iterating ${prefix} at offset ${offset}`, data)
          break
        } else {
          continue
        }
      } else {
        failCount = 0
      }
      if (data.error ?? !data.data) {
        console.log(`Finished iterating ${prefix} at offset ${offset}`, data)
        break
      }
      yield { data, offset }
      ++offset
    } catch (error) {
      console.log(`Error fetching ${prefix}${offset}, retrying in 5 seconds`, error)
      await sleep(5000)
    }
  }
}

export async function appendMissingIdsNBT (itemList: AnimeItem[]): Promise<void> {
  const { m, s } = await generateMappings()

  const nbtItems = [...Object.values(m), ...Object.values(s)].map(i => AnimeItem.fromNBTData(i))

  const tmdbMap = new Map<number, AnimeItem>()
  const tvdbMap = new Map<number, AnimeItem>()
  const imdbMap = new Map<string, AnimeItem>()
  for (const ntbItem of nbtItems) {
    if (ntbItem.themoviedb_id) {
      tmdbMap.set(ntbItem.themoviedb_id, ntbItem)
    }
    if (ntbItem.tvdb_id) {
      tvdbMap.set(ntbItem.tvdb_id, ntbItem)
    }
    if (ntbItem.imdb_id) {
      imdbMap.set(ntbItem.imdb_id, ntbItem)
    }
  }

  for (const item of itemList) {
    const hasTmdbId = item.themoviedb_id
    const hasTvdbId = item.tvdb_id
    const hasImdbId = item.imdb_id

    if (hasTmdbId && hasTvdbId && hasImdbId) continue

    let mergeItem: AnimeItem | undefined
    if (hasTmdbId) {
      mergeItem ??= tmdbMap.get(item.themoviedb_id!)
    }
    if (hasTvdbId) {
      mergeItem ??= tvdbMap.get(item.tvdb_id!)
    }
    if (hasImdbId) {
      mergeItem ??= imdbMap.get(item.imdb_id!)
    }
    if (mergeItem) {
      item.merge(mergeItem)
    }
  }
}
