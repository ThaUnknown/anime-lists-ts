import { XMLParser } from 'fast-xml-parser'

import { ANIMELISTS_URL } from '../constants.ts'
import { AnimeItem } from '../models/animeitem.ts'

async function getData () {
  const response = await fetch(ANIMELISTS_URL)
  return await response.text()
}

interface AnimeListsResponse {
  'anime-list': {
    anime: AnimeListsItem[]
  }
}

export interface AnimeListsItem {
  anidbid: number
  imdbid: string
  tmdbid: string | null
  tmdbtv: number | null
  tvdbid: string
  tmdbseason: string | null
  defaulttvdbseason: string | null
}

export async function generateListAL () {
  const data = await getData()
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
  const xml: AnimeListsResponse = parser.parse(data, true)

  return xml['anime-list'].anime.map(i => AnimeItem.fromAnimeListsSource(i))
}
