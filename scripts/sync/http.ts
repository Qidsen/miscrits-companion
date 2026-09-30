async function fetchWithRetry(url: string, tries = 3, timeoutMs = 60_000): Promise<Response> {
  let last: unknown
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'miscrits-companion-sync' } })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
      return res
    } catch (e) {
      last = e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw last
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url)
  if (!(res.headers.get('content-type') ?? '').includes('json')) throw new Error(`not JSON: ${url}`)
  return res.json() as Promise<T>
}

export async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url, 3, 180_000)
  if (!(res.headers.get('content-type') ?? '').startsWith('image/')) throw new Error(`not an image: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}
