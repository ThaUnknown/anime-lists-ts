import { AnimeItem } from '../models/animeitem.ts'

// TMDB wants payment for API access, so skipping for now
// interface TmdbFindResult {
//   movie_results?: Array<{
//     id: number
//     media_type: string
//   }>
//   tv_results?: Array<{
//     id: number
//     media_type: string
//   }>
// }

// interface TmdbItem {
//   imdb?: string
//   tvdb?: number
// }

// export class TmdbApiDataSource {
//   apiKey = process.env.TMDB_API_KEY ?? ''

//   async loadData (mediaType: string, id: number): Promise<TmdbItem | null> {
//     const url = `https://api.themoviedb.org/3/${mediaType}/${id}/external_ids?api_key=${this.apiKey}`

//     try {
//       const response = await fetch(url)
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//       }

//       const data = await response.json()

//       // Mapping raw API response keys (snake_case) to our model (camelCase/custom)
//       return {
//         imdb: data.imdb_id,
//         tvdb: data.tvdb_id
//       }
//     } catch (e) {
//       console.error(`Error loading TheMovieDB item for mediaType ${mediaType} and id ${id}`, e)
//       return null
//     }
//   }

//   async findItem (lookupId: string, source: string): Promise<TmdbFindResult | null> {
//     const url = `https://api.tmdb.org/3/find/${lookupId}?external_source=${source}&api_key=${this.apiKey}`

//     try {
//       const response = await fetch(url)
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//       }

//       const data = await response.json()

//       // Return result mapped to TmdbFindResult interface
//       return {
//         movie_results: data.movie_results?.map((res: any) => ({
//           id: res.id,
//           media_type: 'movie'
//         })),
//         tv_results: data.tv_results?.map((res: any) => ({
//           id: res.id,
//           media_type: 'tv'
//         }))
//       }
//     } catch (e) {
//       console.error(`Error loading TheMovieDB item for external ID ${lookupId} and source ${source}`, e)
//       return null
//     }
//   }
// }

// export class TheMovieDBService {
//   dataSource = new TmdbApiDataSource()

//   async appendMissingIds (itemList: AnimeItem[]): Promise<void> {
//     console.info('Appending missing IDs to anime list items')

//     for (const item of itemList) {
//       console.info(`Processing item with TMDB ID: [${item.themoviedb_id}], TVDB ID: [${item.tvdb_id}], IMDB ID: [${item.imdb_id}], Type: [${item.type}]`)

//       const hasTmdbId = item.themoviedb_id != null
//       const hasTvdbId = item.tvdb_id != null
//       const hasImdbId = item.imdb_id != null
//       const type = item.type

//       if (hasTmdbId) {
//         // TMDB ID is available, check if other IDs are missing
//         if (!hasTvdbId || !hasImdbId) {
//           console.debug(`TMDB ID [${item.themoviedb_id}] available, TVDB ID [${item.tvdb_id}] or IMDB ID [${item.imdb_id}] missing`)

//           if (type) {
//             let mediaType: 'tv' | 'movie' | null = null
//             if (type === 'TV') {
//               mediaType = 'tv'
//             } else if (type === 'MOVIE') {
//               mediaType = 'movie'
//             } else {
//               console.info(`Item with TMDB ID [${item.themoviedb_id}] has unsupported type [${type}], skipping`)
//             }

//             if (mediaType) {
//               await this.updateInfoFromTmdb(item, mediaType)
//             }
//           }
//         } else {
//           console.info(`TMDB ID [${item.themoviedb_id}], TVDB ID [${item.tvdb_id}], IMDB ID [${item.imdb_id}] available -> nothing to do here`)
//         }
//       } else {
//         // TMDB ID is missing, need to look it up using IMDB or TVDB
//         console.debug('TMDB ID missing, need to look it up')

//         let source: string | null = null
//         let lookupId: string | null = null

//         if (item.imdb_id != null) {
//           console.info(`IMDB ID [${item.imdb_id}] available, looking up TMDB ID`)
//           source = 'imdb_id'
//           lookupId = item.imdb_id
//         } else if (item.tvdb_id != null) {
//           console.info(`TVDB ID [${item.tvdb_id}] available, looking up TMDB ID`)
//           source = 'tvdb_id'
//           lookupId = item.tvdb_id.toString()
//         } else {
//           console.info('No IMDB or TVDB ID available, cannot look up TMDB ID')
//         }

//         if (lookupId && source) {
//           const findResult = await this.dataSource.findItem(lookupId, source)

//           if (findResult) {
//             let foundTmdbID: number | null = null
//             let mediaType: string | null = null

//             // Check movie results
//             if (findResult.movie_results && findResult.movie_results.length > 0) {
//               console.debug(`Found Movie results for source [${source}] with ID [${lookupId}]`)
//               const movieResult = findResult.movie_results[0]!
//               foundTmdbID = movieResult.id
//               mediaType = movieResult.media_type
//             } else if (findResult.tv_results && findResult.tv_results.length > 0) {
//               // Check TV results
//               console.debug(`Found TV results for source [${source}] with ID [${lookupId}]`)
//               const tvResult = findResult.tv_results[0]!
//               foundTmdbID = tvResult.id
//               mediaType = tvResult.media_type
//             }

//             if (foundTmdbID != null && mediaType != null) {
//               item.themoviedb_id = foundTmdbID
//               await this.updateInfoFromTmdb(item, mediaType)
//             } else {
//               console.info(`TMDB Lookup returned nothing for source [${source}] with ID [${lookupId}]`)
//             }
//           } else {
//             console.info('TMDB Lookup returned nothing.')
//           }
//         }
//       }
//       console.info(`Finished processing item with TMDB ID: [${item.themoviedb_id}], TVDB ID: [${item.tvdb_id}], IMDB ID: [${item.imdb_id}], Type: [${item.type}]`)
//     }
//   }

//   /**
//      * Update the IMDB and TVDB ID from the TMDB API
//      */
//   private async updateInfoFromTmdb (item: AnimeItem, mediaType: string): Promise<void> {
//     if (!item.themoviedb_id) return

//     const tmdbItem = await this.dataSource.loadData(mediaType, item.themoviedb_id)
//     if (tmdbItem) {
//       const updates: string[] = []

//       if (tmdbItem.imdb != null) {
//         const oldImdb = item.imdb_id
//         item.imdb_id = tmdbItem.imdb
//         updates.push(`IMDB ID: [${oldImdb}->${tmdbItem.imdb}]`)
//       }
//       if (tmdbItem.tvdb != null) {
//         const oldTvdb = item.tvdb_id
//         item.tvdb_id = tmdbItem.tvdb
//         updates.push(`TVDB ID: [${oldTvdb}->${tmdbItem.tvdb}]`)
//       }

//       if (updates.length > 0) {
//         console.info(`Updating item with TMDB ID [${item.themoviedb_id}] from TMDB API [old->new]: ${updates.join(', ')}`)
//       } else {
//         console.info(`No updates needed/possible for item with TMDB ID [${item.themoviedb_id}]`)
//       }
//     }
//   }
// }

async function getData () {
  const res = await fetch('https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json')
  return await res.json()
}

export async function appendMissingIds (itemList: AnimeItem[]): Promise<void> {
  const items = await getData()
  const fribbItems = items.map(i => new AnimeItem().merge(i))
  const tmdbMap = new Map<number, AnimeItem>()
  const tvdbMap = new Map<number, AnimeItem>()
  const imdbMap = new Map<string, AnimeItem>()
  for (const fribbItem of fribbItems) {
    if (fribbItem.themoviedb_id) {
      tmdbMap.set(fribbItem.themoviedb_id, fribbItem)
    }
    if (fribbItem.tvdb_id) {
      tvdbMap.set(fribbItem.tvdb_id, fribbItem)
    }
    if (fribbItem.imdb_id) {
      imdbMap.set(fribbItem.imdb_id, fribbItem)
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
