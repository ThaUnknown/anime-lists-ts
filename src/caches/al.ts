import { readFile, writeFile } from 'node:fs/promises'

export async function getCache () {
  try {
    return JSON.parse(await readFile('cache/al.json', 'utf-8')) as Record<string, number>
  } catch {
    return {}
  }
}

export async function mergeCache (newData: Record<string, number>) {
  const existing = await getCache()
  const merged = { ...existing, ...newData }
  await writeFile('cache/al.json', JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}
