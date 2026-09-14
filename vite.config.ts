import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_ARC_GIT_SHA': JSON.stringify(gitSha()),
    'import.meta.env.VITE_ARC_BUILD_LABEL': JSON.stringify(process.env.VITE_ARC_BUILD_LABEL ?? ''),
    'import.meta.env.VITE_ARC_DESK_PREVIEW': JSON.stringify(process.env.VITE_ARC_DESK_PREVIEW ?? ''),
  },
})
