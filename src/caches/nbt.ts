import { readFile, writeFile } from 'node:fs/promises'

export interface NBTItemData {
  tmdbId?: number
  imdbId?: string
  tvdbId?: number
}

export interface NBTCache {
  m: Record<string, NBTItemData>
  s: Record<string, NBTItemData>
}

export async function getCache () {
  try {
    return JSON.parse(await readFile('cache/nbt.json', 'utf-8')) as NBTCache
  } catch {
    return { m: {}, s: {} }
  }
}

export async function mergeCache (newData: NBTCache) {
  const existing = await getCache()

  const merged: NBTCache = { m: {}, s: {} }
  // merge keys
  merged.m = { ...existing.m, ...newData.m }
  merged.s = { ...existing.s, ...newData.s }

  await writeFile('cache/nbt.json', JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}
