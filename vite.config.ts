import { execSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function gitSha(): string {
  const fromEnv = process.env.VITE_ARC_GIT_SHA?.trim()
  if (fromEnv) return fromEnv
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function deskPreviewBuildActive(): boolean {
  return (
    process.env.VITE_ARC_DESK_PREVIEW === 'true'
    || process.env.VITE_ARC_BUILD_LABEL === 'desk-v2'
  )
}

/** Bakes desk-v2 stamp into dist/index.html for every preview:desk production build. */
function arcDeskBuildStampPlugin(): Plugin {
  return {
    name: 'arc-desk-build-stamp',
    transformIndexHtml(html) {
      if (!deskPreviewBuildActive()) return html

      const sha = gitSha()
      const label = process.env.VITE_ARC_BUILD_LABEL?.trim() || 'desk-v2'
      const dataBuild = `${label}@${sha}`
      const footerText = `${label} · ${sha}`

      let next = html.replace(/<html([^>]*)>/i, (_match, attrs: string) => {
        const withoutBuild = attrs.replace(/\sdata-build="[^"]*"/gi, '')
        return `<html${withoutBuild} data-build="${dataBuild}">`
      })

      const stampMarkup = [
        '<footer',
        '  id="arc-desk-build-stamp-html"',
        '  class="arc-desk-build-stamp arc-desk-build-stamp--html"',
        '  aria-hidden="true"',
        `  data-build="${dataBuild}"`,
        '  style="position:fixed;right:8px;bottom:6px;z-index:99999;padding:2px 6px;border-radius:4px;font:600 10px/1.2 system-ui,sans-serif;letter-spacing:0.04em;color:rgba(33,29,23,0.72);background:rgba(251,248,240,0.82);pointer-events:none;opacity:0.85"',
        `>${footerText}</footer>`,
      ].join('\n')

      if (next.indexOf('arc-desk-build-stamp--html') === -1) {
        next = next.replace('</body>', `${stampMarkup}\n</body>`)
      }

      return next
    },
  }
}

export default defineConfig({
  plugins: [react(), arcDeskBuildStampPlugin()],
  define: {
    'import.meta.env.VITE_ARC_GIT_SHA': JSON.stringify(gitSha()),
    'import.meta.env.VITE_ARC_BUILD_LABEL': JSON.stringify(process.env.VITE_ARC_BUILD_LABEL ?? ''),
    'import.meta.env.VITE_ARC_DESK_PREVIEW': JSON.stringify(process.env.VITE_ARC_DESK_PREVIEW ?? ''),
  },
})
