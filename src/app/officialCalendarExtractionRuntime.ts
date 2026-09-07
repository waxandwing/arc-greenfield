import type { OfficialCalendarExtractionAdapter } from '../calendar/officialCalendarDateAcquisition'
import { createOcpsCalendarServerExtractionAdapter } from '../calendar/ocpsCalendarServerAdapter'

export type ConfiguredOfficialCalendarExtraction =
  | { adapter: OfficialCalendarExtractionAdapter; message: null }
  | { adapter: null; message: string }

export function configuredOfficialCalendarExtractionAdapter(): ConfiguredOfficialCalendarExtraction {
  const endpoint = import.meta.env.VITE_ARC_CALENDAR_TEXT_ENDPOINT?.trim()
  const authorizationToken = import.meta.env.VITE_ARC_CALENDAR_TEXT_AUTH_TOKEN?.trim()
  const apiKey = import.meta.env.VITE_ARC_CALENDAR_TEXT_API_KEY?.trim()

  if (!endpoint || !authorizationToken) {
    return {
      adapter: null,
      message: 'Official calendar reading is not configured in this Arc environment. No dates were created.',
    }
  }

  try {
    return {
      adapter: createOcpsCalendarServerExtractionAdapter({
        endpoint,
        authorizationToken,
        apiKey: apiKey || undefined,
      }),
      message: null,
    }
  } catch (error) {
    return {
      adapter: null,
      message: `Official calendar reading is unavailable. No dates were created. ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
