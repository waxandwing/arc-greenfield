import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const pdfUrl = 'https://www.ocps.net/110680_3'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()
const consoleErrors = []
const failedRequests = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('requestfailed', (request) => {
  if (request.url() === pdfUrl) {
    failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' })
  }
})

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

console.log(JSON.stringify({ pdfUrl, ...result, consoleErrors, failedRequests }, null, 2))

// Observational architecture probe: browser blocking is a valid result, not an Arc product failure.
assert(await page.locator('body').count() === 1, 'Arc preview did not load before the PDF fetch probe.')

await context.close()
await browser.close()
