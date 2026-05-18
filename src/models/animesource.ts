import type { AnimeItem } from './animeitem.ts'

export abstract class AnimeSource {
  host
  constructor (host: string) {
    this.host = host
  }

    abstract setId(item: AnimeItem, id: string): void

    extractId (sourceUrl: string): string | null {
      try {
        const url = new URL(sourceUrl)
        const segments = url.pathname.split('/').filter(s => s.length > 0)
        return segments.length > 0 ? segments[segments.length - 1]! : null
      } catch (e) {
        return null
      }
    }

    static fromUrl (sourceUrl: string): AnimeSource | null {
      try {
        const host = new URL(sourceUrl).hostname
        return SOURCES.find(s => host.includes(s.host)) ?? null
      } catch {
        console.error(`Invalid URL passed to AnimeSource.fromUrl: ${sourceUrl}`)
        return null
      }
    }
}

class AniDBSource extends AnimeSource {
  constructor () { super('anidb.net') }
  setId (item: AnimeItem, id: string) { item.anidb_id = parseInt(id, 10) }
}

class AniListSource extends AnimeSource {
  constructor () { super('anilist.co') }
  setId (item: AnimeItem, id: string) { item.anilist_id = parseInt(id, 10) }
}

class AnimeCountdownSource extends AnimeSource {
  constructor () { super('animecountdown.com') }
  setId (item: AnimeItem, id: string) { item.animecountdown_id = parseInt(id, 10) }
}

class AnimeNewsNetworkSource extends AnimeSource {
  constructor () { super('animenewsnetwork.com') }
  setId (item: AnimeItem, id: string) { item.animenewsnetwork_id = parseInt(id, 10) }
  // ANN uses ?id= instead of path
  override extractId (sourceUrl: string): string | null {
    const match = sourceUrl.match(/id=(\d+)/)
    return match ? match[1]! : null
  }
}

class AnimePlanetSource extends AnimeSource {
  constructor () { super('anime-planet.com') }
  setId (item: AnimeItem, id: string) { item['anime-planet_id'] = id } // String ID
}

class AniSearchSource extends AnimeSource {
  constructor () { super('anisearch.com') }
  setId (item: AnimeItem, id: string) { item.anisearch_id = parseInt(id, 10) }
}

class KitsuSource extends AnimeSource {
  constructor () { super('kitsu.app') }
  setId (item: AnimeItem, id: string) { item.kitsu_id = parseInt(id, 10) }
}

class LivechartSource extends AnimeSource {
  constructor () { super('livechart.me') }
  setId (item: AnimeItem, id: string) { item.livechart_id = parseInt(id, 10) }
}

class MyAnimeListSource extends AnimeSource {
  constructor () { super('myanimelist.net') }
  setId (item: AnimeItem, id: string) { item.mal_id = parseInt(id, 10) }
}

class SimklSource extends AnimeSource {
  constructor () { super('simkl.com') }
  setId (item: AnimeItem, id: string) { item.simkl_id = parseInt(id, 10) }
}

// Registry array for lookup
const SOURCES: AnimeSource[] = [
  new AniDBSource(), new AniListSource(), new AnimeCountdownSource(),
  new AnimeNewsNetworkSource(), new AnimePlanetSource(), new AniSearchSource(),
  new KitsuSource(), new LivechartSource(), new MyAnimeListSource(), new SimklSource()
]
