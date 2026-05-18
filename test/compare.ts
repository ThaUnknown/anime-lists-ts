// compare against fribbs list, to verify anidb:anilist mappings:
import localData from '../data/anime-list.json' with { type: 'json' }

const FRIB = 'https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json'

const fribData = await fetch(FRIB).then(res => res.json())

const fribMap = new Map<number, number>()
for (const item of fribData) {
  if (item.anidb_id != null && item.anilist_id != null) {
    if (fribMap.has(item.anidb_id)) {
      console.warn(`Duplicate AniDB ID ${item.anidb_id} in Fribb's data with Anilist IDs ${fribMap.get(item.anidb_id)} and ${item.anilist_id}`)
    }
    fribMap.set(item.anidb_id, item.anilist_id)
  }
}

const localMap = new Map<number, number>()
for (const item of localData) {
  if (item.anidb_id != null && item.anilist_id != null) {
    if (localMap.has(item.anidb_id)) {
      console.warn(`Duplicate AniDB ID ${item.anidb_id} in local data with Anilist IDs ${localMap.get(item.anidb_id)} and ${item.anilist_id}`)
    }
    localMap.set(item.anidb_id, item.anilist_id)
  }
}

for (const [anidbId, anilistId] of fribMap.entries()) {
  const localAnilistId = localMap.get(anidbId)
  if (localAnilistId !== anilistId) {
    console.warn(`Mismatch for AniDB ID ${anidbId}: Fribb has Anilist ID ${anilistId}, but local data has Anilist ID ${localAnilistId}`)
  }
}

for (const [anidbId, anilistId] of localMap.entries()) {
  const fribAnilistId = fribMap.get(anidbId)
  if (fribAnilistId !== anilistId) {
    console.warn(`Mismatch for AniDB ID ${anidbId}: Local data has Anilist ID ${anilistId}, but Fribb has Anilist ID ${fribAnilistId}`)
  }
}

// verify duplicate anilist ids on local data
const anilistIdToAnidbIds = new Set<number>()
for (const item of localData) {
  if (item.anilist_id != null) {
    if (anilistIdToAnidbIds.has(item.anilist_id)) {
      console.warn(`Duplicate Anilist ID https://anilist.co/anime/${item.anilist_id} in local data with AniDB IDs ${item}`)
    }
    anilistIdToAnidbIds.add(item.anilist_id)
  }
}

const fribAnilistIdToAnidbIds = new Set<number>()
for (const item of fribData) {
  if (item.anilist_id != null) {
    if (fribAnilistIdToAnidbIds.has(item.anilist_id)) {
      console.warn(`Duplicate Anilist ID https://anilist.co/anime/${item.anilist_id} in Fribb's data with AniDB IDs ${item}`)
    }
    fribAnilistIdToAnidbIds.add(item.anilist_id)
  }
}

console.log(`Compared ${fribMap.size} Frib AniDB-Anilist mappings from Fribb's data against ${localMap.size} local data entries.`)
