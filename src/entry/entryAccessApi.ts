import { publicAssetUrl } from '../publicAssetUrl'

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

export function isStaticEntryPreviewHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === '127.0.0.1' || host === 'localhost' || host.endsWith('.github.io')
}

export async function verifyBetaPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const supplied = password.trim()
  if (!supplied) return { ok: false, error: 'Enter the beta password.' }

  try {
    const response = await fetch(apiUrl('/api/beta-access'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: supplied }),
    })
    const result = await response.json().catch(() => ({ ok: false }))
    if (response.ok && result.ok) return { ok: true }
  } catch {
    // Static hosting (GitHub Pages) has no /api — fall through to build-time beta secret.
  }

  const clientSecret = import.meta.env.VITE_ARC_BETA_PASSWORD?.trim()
  if (clientSecret && supplied === clientSecret) return { ok: true }

  return { ok: false, error: 'That password did not open Arc.' }
}

export type InterestSignupInput = {
  email: string
  name: string
  role: string
  website: string
}

export type InterestSignupResult =
  | { ok: true; duplicate?: boolean; previewOnly?: boolean }
  | { ok: false; error: string }

export async function submitInterestSignup(input: InterestSignupInput): Promise<InterestSignupResult> {
  if (input.website.trim()) return { ok: true }

  const email = input.email.trim()
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  try {
    const response = await fetch(apiUrl('/api/interest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: input.name.trim(),
        role: input.role.trim(),
        website: input.website.trim(),
      }),
    })
    const result = await response.json().catch(() => ({ ok: false }))
    if (response.status === 409 || result.duplicate) return { ok: true, duplicate: true }
    if (response.ok && result.ok) return { ok: true }
    if (!isStaticEntryPreviewHost()) {
      return { ok: false, error: 'We could not add you right now. Try again.' }
    }
  } catch {
    if (!isStaticEntryPreviewHost()) {
      return { ok: false, error: 'We could not add you right now. Try again.' }
    }
  }

  // GitHub Pages/local static preview has no serverless /api route. Keep the full
  // signup interaction testable without pretending the address was submitted.
  return { ok: true, previewOnly: true }
}

const configuredSplashVideo = import.meta.env.VITE_ARC_SPLASH_VIDEO?.trim()
export const ENTRY_SPLASH_VIDEO = configuredSplashVideo
  ? (configuredSplashVideo.startsWith('http') ? configuredSplashVideo : publicAssetUrl(configuredSplashVideo))
  : ''
export const ENTRY_SPLASH_POSTER = publicAssetUrl('assets/arc/arc-mark-stacked.png')
export const ENTRY_PATTERN_ASSET = publicAssetUrl('assets/arc/pattern-arc-geometric.png')
