import { AnimeSource } from './animesource.ts'

import type { AnimeListsItem } from '../sources/animelists.ts'

interface Season {
  theMovieDb?: number | null
  thetvdb?: number | null
}

export class AnimeItem {
  type?: string | null
  anidb_id?: number | null
  anilist_id?: number | null
  animecountdown_id?: number | null
  animenewsnetwork_id?: number | null
  'anime-planet_id'?: string | null
  anisearch_id?: number | null
  imdb_id?: string | null
  kitsu_id?: number | null
  livechart_id?: number | null
  mal_id?: number | null
  simkl_id?: number | null
  themoviedb_id?: number | null
  tvdb_id?: number | null
  season?: Season | null

  static fromAODBSourceUrls (sources: string[]): AnimeItem {
    const animeItem = new AnimeItem()

    for (const sourceUrl of sources) {
      const source = AnimeSource.fromUrl(sourceUrl)
      if (source) {
        const id = source.extractId(sourceUrl)
        if (id) {
          source.setId(animeItem, id)
        }
      }
    }

    return animeItem
  }

  static fromAnimeListsSource (item: AnimeListsItem): AnimeItem {
    const animeItem = new AnimeItem()

    // set the AniDB ID
    animeItem.anidb_id = Number(item.anidbid)

    // set the IMDB ID
    animeItem.imdb_id = item.imdbid

    // set the TMDB ID logic
    const tmdbId = item.tmdbid
    const tmdbTvId = item.tmdbtv

    if (tmdbId != null && tmdbTvId != null) {
      console.warn(`Both TMDB ID (${tmdbId}) and TMDB TV ID (${tmdbTvId}) were set, don't know what to do`)
    } else if (tmdbId != null) {
      animeItem.themoviedb_id = this.parseStringToInteger(item.anidbid, 'tmdb id', tmdbId)
    } else if (tmdbTvId != null) {
      animeItem.themoviedb_id = Number(tmdbTvId)
    }

    // set TVDB ID
    animeItem.tvdb_id = this.parseStringToInteger(item.anidbid, 'tvdb id', item.tvdbid)

    // add season information
    let season: Season | undefined

    // set TMDB season
    const tmdbSeason = item.tmdbseason
    if (tmdbSeason != null && tmdbSeason !== '0') {
      season ??= {}
      season.theMovieDb = this.parseStringToInteger(item.anidbid, 'tmdb season', tmdbSeason)
    }

    // set TVDB season
    const defaultTvdbSeason = item.defaulttvdbseason
    if (
      defaultTvdbSeason != null &&
            item.tvdbid !== 'movie' &&
            defaultTvdbSeason !== 'a' &&
            defaultTvdbSeason !== '0'
    ) {
      season ??= {}
      season.thetvdb = this.parseStringToInteger(item.anidbid, 'tvdb season', defaultTvdbSeason)
    }

    animeItem.season = season

    return animeItem
  }

  /**
     * Parse the ID as a string to a number
     */
  static parseStringToInteger (itemId: number, type: string, stringToParse: string): number | null {
    const parsed = parseInt(stringToParse, 10)
    if (!isNaN(parsed) && /^\d+$/.test(stringToParse)) {
      return parsed
    } else {
      console.warn(`[AniDB ID=${itemId}] could not parse ${type} '${stringToParse}' because it isn't an Integer`)
      return null
    }
  }

  /**
     * Merge the 'other' AnimeItem into this one.
     */
  merge (other: AnimeItem) {
    this.type ??= other.type
    this.anilist_id ??= other.anilist_id
    this.animecountdown_id ??= other.animecountdown_id
    this.animenewsnetwork_id ??= other.animenewsnetwork_id
    this['anime-planet_id'] ??= other['anime-planet_id']
    this.anisearch_id ??= other.anisearch_id
    this.imdb_id ??= other.imdb_id
    this.kitsu_id ??= other.kitsu_id
    this.livechart_id ??= other.livechart_id
    this.mal_id ??= other.mal_id
    this.simkl_id ??= other.simkl_id
    this.themoviedb_id ??= other.themoviedb_id
    this.tvdb_id ??= other.tvdb_id
    this.season ??= other.season

    return this
  }
}
