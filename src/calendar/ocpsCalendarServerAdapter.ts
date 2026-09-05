import type {
  OfficialCalendarExtractionAdapter,
  OfficialCalendarStructuredExtraction,
} from './officialCalendarDateAcquisition'
import { isSupportedOcpsCalendarLocator, parseOcpsCalendarText } from './ocpsCalendarTextParser'
import type { OfficialCalendarSourceCandidate } from './sourceAcquisition'

export type OcpsCalendarServerAdapterOptions = {
  endpoint: string
  authorizationToken: string
  apiKey?: string
  fetchImpl?: typeof fetch
}

type ServerTextPayload = {
  sourceLocator: string
  sourceLabel: string
  publisher: string
  capturedAt?: string
  totalPages: number
  text: string
}

export function createOcpsCalendarServerExtractionAdapter(
  options: OcpsCalendarServerAdapterOptions,
): OfficialCalendarExtractionAdapter {
  const endpoint = normalizeEndpoint(options.endpoint)
  const authorizationToken = options.authorizationToken.trim()
  if (!authorizationToken) throw new Error('OCPS server extraction adapter requires an authorization token.')
  const fetchImpl = options.fetchImpl ?? fetch

  return {
    id: 'ocps-official-calendar-server-text-v1',
    supports(source: OfficialCalendarSourceCandidate): boolean {
      return source.kind === 'district-calendar-document' && isSupportedOcpsCalendarLocator(source.locator)
    },
    async extract(source: OfficialCalendarSourceCandidate): Promise<OfficialCalendarStructuredExtraction> {
      if (source.kind !== 'district-calendar-document' || !isSupportedOcpsCalendarLocator(source.locator)) {
        throw new Error('OCPS server extractor does not support this calendar source.')
      }

      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authorizationToken}`,
          ...(options.apiKey?.trim() ? { apikey: options.apiKey.trim() } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceLocator: source.locator }),
      })

      const payload = await readJson(response)
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' && payload.error.trim()
          ? payload.error.trim()
          : `Official calendar text service returned HTTP ${response.status}.`)
      }

      const serverPayload = validateServerPayload(payload)
      return parseOcpsCalendarText({
        sourceLocator: serverPayload.sourceLocator,
        sourceLabel: serverPayload.sourceLabel,
        publisher: serverPayload.publisher,
        capturedAt: serverPayload.capturedAt,
        text: serverPayload.text,
      })
    },
  }
}

function normalizeEndpoint(value: string): string {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Official calendar text service endpoint is not a valid URL.') }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('Official calendar text service endpoint must use HTTPS outside local development.')
  }
  return url.toString()
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value = await response.json()
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not an object')
    return value as Record<string, unknown>
  } catch {
    throw new Error('Official calendar text service returned malformed JSON.')
  }
}

function validateServerPayload(value: Record<string, unknown>): ServerTextPayload {
  const sourceLocator = requiredString(value.sourceLocator, 'sourceLocator')
  const sourceLabel = requiredString(value.sourceLabel, 'sourceLabel')
  const publisher = requiredString(value.publisher, 'publisher')
  const text = requiredString(value.text, 'text')
  const capturedAt = optionalString(value.capturedAt)
  const totalPages = value.totalPages
  if (!Number.isInteger(totalPages) || (totalPages as number) < 1 || (totalPages as number) > 10) {
    throw new Error('Official calendar text service returned an invalid page count.')
  }
  return { sourceLocator, sourceLabel, publisher, capturedAt, totalPages: totalPages as number, text }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Official calendar text service response is missing ${field}.`)
  return value.trim()
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
