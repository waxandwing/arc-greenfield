import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const pdfUrl = 'https://www.ocps.net/UserFiles/Servers/Server_54619/File/Frequently%20Updated%20Documents/2026-2027%20School%20Calendar.pdf'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()

await page.goto(baseUrl, { waitUntil: 'networkidle' })

const result = await page.evaluate(async (url) => {
  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
    const contentType = response.headers.get('content-type') ?? ''
    const contentLength = response.headers.get('content-length')
    const bytes = new Uint8Array(await response.arrayBuffer())
    const prefix = Array.from(bytes.slice(0, 5)).map((value) => String.fromCharCode(value)).join('')
    return {
      ok: response.ok,
      status: response.status,
      type: response.type,
      contentType,
      contentLength,
      byteLength: bytes.byteLength,
      prefix,
      errorName: null,
      errorMessage: null,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      type: null,
      contentType: null,
      contentLength: null,
      byteLength: 0,
      prefix: '',
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}, pdfUrl)

console.log(JSON.stringify({ pdfUrl, ...result }, null, 2))

// This audit is intentionally observational. A blocked CORS request is an architectural result,
// not a failing Arc product test. The only hard assertion is that the app page itself loaded.
assert(await page.locator('body').count() === 1, 'Arc preview did not load before the PDF fetch probe.')

await context.close()
await browser.close()
