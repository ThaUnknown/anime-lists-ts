import { readFile } from 'node:fs/promises'

if (process.env.WEBHOOK_URL) {
  const response = await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.WEBHOOK_API_KEY ?? ''
    },
    body: await readFile('data/anime-list.json', 'utf-8')
  })
  if (response.ok) {
    console.log('Successfully pushed data to webhook')
  } else {
    console.error(`Failed to push data to webhook: ${response.status} ${response.statusText}`)
  }
} else {
  console.log('No WEBHOOK_URL environment variable set, skipping POST')
}
