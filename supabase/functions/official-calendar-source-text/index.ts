import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1'

const SUPPORTED_SOURCE = 'https://www.ocps.net/110680_3'
const MAX_PDF_BYTES = 2_000_000
const MAX_PAGES = 10
const MAX_TEXT_CHARS = 120_000
const FETCH_TIMEOUT_MS = 12_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'POST required.' }, 405)

  let requestedLocator: string
  try {
    const body = await req.json()
    requestedLocator = normalizeSupportedLocator(body?.sourceLocator)
  } catch (error) {
    return json({ error: messageOf(error) }, 400)
  }

  let response: Response
  try {
    response = await fetch(requestedLocator, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'application/pdf' },
    })
  } catch (error) {
    return json({ error: `Official calendar source fetch failed. ${messageOf(error)}` }, 502)
  }

  if (!response.ok) return json({ error: `Official calendar source returned HTTP ${response.status}.` }, 502)

  const contentLength = Number(response.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_BYTES) {
    return json({ error: 'Official calendar PDF exceeds Arc’s supported size limit.' }, 413)
  }

  let bytes: Uint8Array
  try {
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength === 0) return json({ error: 'Official calendar source returned an empty file.' }, 502)
    if (buffer.byteLength > MAX_PDF_BYTES) return json({ error: 'Official calendar PDF exceeds Arc’s supported size limit.' }, 413)
    bytes = new Uint8Array(buffer)
  } catch (error) {
    return json({ error: `Arc could not read the official calendar response. ${messageOf(error)}` }, 502)
  }

  if (pdfMagic(bytes) !== '%PDF-') {
    return json({ error: 'Official calendar source did not return a PDF.' }, 422)
  }

  const byteLength = bytes.byteLength
  let totalPages: number
  let text: string
  try {
    const pdf = await getDocumentProxy(bytes)
    const extraction = await extractText(pdf, { mergePages: true })
    totalPages = extraction.totalPages
    text = extraction.text.trim()
  } catch (error) {
    return json({ error: `Arc could not extract text from the official calendar PDF. ${messageOf(error)}` }, 422)
  }

  if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > MAX_PAGES) {
    return json({ error: `Official calendar PDF page count ${totalPages} is outside Arc’s supported range.` }, 422)
  }
  if (!text) return json({ error: 'Official calendar PDF did not contain extractable text.' }, 422)
  if (text.length > MAX_TEXT_CHARS) return json({ error: 'Extracted calendar text exceeds Arc’s supported size limit.' }, 422)

  return json({
    sourceLocator: requestedLocator,
    sourceLabel: 'OCPS 2026–27 School Calendar',
    publisher: 'Orange County Public Schools',
    capturedAt: new Date().toISOString(),
    byteLength,
    totalPages,
    text,
  }, 200)
})

function normalizeSupportedLocator(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('sourceLocator is required.')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('sourceLocator must be a valid URL.') }
  if (url.protocol !== 'https:') throw new Error('sourceLocator must use HTTPS.')
  url.search = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  const normalized = url.toString().replace(/\/$/, '')
  if (normalized !== SUPPORTED_SOURCE) throw new Error('This extractor supports only the confirmed OCPS 2026–27 calendar source.')
  return normalized
}

function pdfMagic(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, 5)).map((value) => String.fromCharCode(value)).join('')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
