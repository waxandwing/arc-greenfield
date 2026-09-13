export type ImportSourceType = 'curriculum-csv' | 'prior-arc'

export type ImportProvenance = {
  sourceType: ImportSourceType
  sourceIdentity: string
  sourceRow: string
  structuralPath: string
  fingerprint: string
  sourceValueHash: string
  importedAt: string
}

export function normalizeImportProvenance(value: ImportProvenance | undefined): ImportProvenance | undefined {
  if (!value) return undefined
  const normalized: ImportProvenance = {
    sourceType: value.sourceType,
    sourceIdentity: value.sourceIdentity.trim(),
    sourceRow: value.sourceRow.trim(),
    structuralPath: value.structuralPath.trim(),
    fingerprint: value.fingerprint.trim(),
    sourceValueHash: value.sourceValueHash.trim(),
    importedAt: value.importedAt,
  }
  const errors = validateImportProvenance(normalized)
  if (errors.length) throw new Error(errors.join(' '))
  return normalized
}

export function validateImportProvenance(value: ImportProvenance): string[] {
  const errors: string[] = []
  if (!['curriculum-csv', 'prior-arc'].includes(value.sourceType)) errors.push('Import source type is not supported.')
  if (!value.sourceIdentity) errors.push('Import source identity is required.')
  if (!value.sourceRow) errors.push('Import source row is required.')
  if (!value.structuralPath) errors.push('Import structural path is required.')
  if (!value.fingerprint) errors.push('Import fingerprint is required.')
  if (!value.sourceValueHash) errors.push('Import source value hash is required.')
  if (Number.isNaN(Date.parse(value.importedAt))) errors.push('Import timestamp is invalid.')
  return errors
}

export function stableTextHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}
