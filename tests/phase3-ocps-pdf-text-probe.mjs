import { extractText, getDocumentProxy } from 'unpdf'

const sourceUrl = 'https://www.ocps.net/110680_3'
const response = await fetch(sourceUrl, { redirect: 'follow' })
if (!response.ok) throw new Error(`OCPS source returned HTTP ${response.status}.`)
const bytes = new Uint8Array(await response.arrayBuffer())
if (bytes.byteLength > 2_000_000) throw new Error(`OCPS source exceeded 2 MB (${bytes.byteLength} bytes).`)
const magic = Array.from(bytes.slice(0, 5)).map((value) => String.fromCharCode(value)).join('')
if (magic !== '%PDF-') throw new Error(`OCPS source is not a PDF (magic ${JSON.stringify(magic)}).`)
const pdf = await getDocumentProxy(bytes)
const extracted = await extractText(pdf, { mergePages: true })
console.log(JSON.stringify({
  sourceUrl,
  byteLength: bytes.byteLength,
  totalPages: extracted.totalPages,
  text: extracted.text,
}, null, 2))
