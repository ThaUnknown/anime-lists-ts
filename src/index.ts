import { writeFile } from 'node:fs/promises'

import { generateListAL } from './sources/animelists.ts'
import { generateListAOD } from './sources/animeofflinedb.ts'
import { appendMissingIds } from './sources/tmdb.ts'

import type { AnimeItem } from './models/animeitem.ts'

function mergeLists (al: AnimeItem[], aoodb: AnimeItem[]): AnimeItem[] {
  const masterMap = new Map<number, AnimeItem>()
  const noAniDBItems: AnimeItem[] = []
  for (const aodbItem of aoodb) {
    if (aodbItem.anidb_id != null) {
      masterMap.set(aodbItem.anidb_id, aodbItem)
    } else {
      noAniDBItems.push(aodbItem)
    }
  }
  for (const animeListsItem of al) {
    const anidbId = animeListsItem.anidb_id
    if (anidbId != null) {
      if (masterMap.has(anidbId)) {
        const merged = masterMap.get(anidbId)!.merge(animeListsItem)
        masterMap.set(anidbId, merged)
      } else {
        masterMap.set(anidbId, animeListsItem)
      }
    } else {
      noAniDBItems.push(animeListsItem)
    }
  }

  const mergedList = Array.from(masterMap.values())
  mergedList.sort((a, b) => (a.anidb_id! - b.anidb_id!))
  mergedList.push(...noAniDBItems)
  return mergedList
}

const parsedAODBItems = await generateListAOD()

const parsedAnimeListItems = await generateListAL()

const merged = mergeLists(parsedAnimeListItems, parsedAODBItems)

await appendMissingIds(merged)

await writeFile('data/anime-list.json', JSON.stringify(merged, null, 2), 'utf-8')
console.log(`Wrote ${merged.length} items to anime-list.json`)

if (process.env.WEBHOOK_URL) {
  const response = await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(merged)
  })
  if (response.ok) {
    console.log('Successfully pushed data to webhook')
  }
}
