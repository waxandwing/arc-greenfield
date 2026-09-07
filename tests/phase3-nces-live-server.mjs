import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fetchNcesProxy } from '../server/ncesProxy.mjs'

const root = join(process.cwd(), 'dist')
const port = Number(process.env.PORT || 4173)

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || `127.0.0.1:${port}`}`)
    if (url.pathname === '/api/nces') {
      if (request.method !== 'GET') {
        response.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }
      const result = await fetchNcesProxy({
        schoolName: url.searchParams.get('schoolName') || '', city: url.searchParams.get('city') || '', state: url.searchParams.get('state') || '',
        districtName: url.searchParams.get('districtName') || '', maxCandidates: url.searchParams.get('maxCandidates') || '',
      })
      response.writeHead(result.status, { 'Content-Type': result.contentType, 'Cache-Control': 'no-store' })
      response.end(result.body)
      return
    }
    const rawPath = url.pathname === '/' ? '/index.html' : url.pathname
    const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '')
    const candidate = join(root, safePath)
    const filePath = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, 'index.html')
    response.writeHead(200, { 'Content-Type': contentType(filePath) })
    createReadStream(filePath).pipe(response)
  } catch (error) {
    response.writeHead(502, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
  }
})

server.listen(port, '127.0.0.1', () => console.log(`phase3 NCES live server listening on http://127.0.0.1:${port}`))

function contentType(path) {
  switch (extname(path)) {
    case '.html': return 'text/html; charset=utf-8'
    case '.js': return 'text/javascript; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.svg': return 'image/svg+xml'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    default: return 'application/octet-stream'
  }
}
