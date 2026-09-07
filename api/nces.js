import { fetchNcesProxy } from '../server/ncesProxy.mjs'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const result = await fetchNcesProxy({
      schoolName: request.query.schoolName,
      city: request.query.city,
      state: request.query.state,
      districtName: request.query.districtName,
      maxCandidates: request.query.maxCandidates,
    })
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    response.setHeader('Content-Type', result.contentType)
    response.status(result.status).send(result.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NCES proxy failed.'
    response.status(400).json({ error: { message } })
  }
}
