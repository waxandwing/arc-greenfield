import { createArcTablePassState, type ArcTablePass, type ArcTablePerson } from './arcTableTools'

export const ARC_TABLE_SECTION_CONFIG_STORAGE_KEY = 'arc.arctable.sections.v1'

export type ArcTableSectionConfig = {
  sectionId: string
  roster: ArcTablePerson[]
  passDefinitions: Array<Pick<ArcTablePass, 'id' | 'label'>>
}

type StoredSectionConfigs = { schemaVersion: 1; sections: ArcTableSectionConfig[] }

export function defaultArcTableSectionConfig(sectionId: string): ArcTableSectionConfig {
  return {
    sectionId,
    roster: [],
    passDefinitions: createArcTablePassState(sectionId).passes.map(({ id, label }) => ({ id, label })),
  }
}

export function loadArcTableSectionConfig(
  sectionId: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): ArcTableSectionConfig {
  try {
    const raw = storage.getItem(ARC_TABLE_SECTION_CONFIG_STORAGE_KEY)
    if (!raw) return defaultArcTableSectionConfig(sectionId)
    const parsed = JSON.parse(raw) as Partial<StoredSectionConfigs>
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.sections)) return defaultArcTableSectionConfig(sectionId)
    const config = parsed.sections.find((candidate) => candidate?.sectionId === sectionId)
    return validateArcTableSectionConfig(config) ? copyConfig(config) : defaultArcTableSectionConfig(sectionId)
  } catch {
    return defaultArcTableSectionConfig(sectionId)
  }
}

export function saveArcTableSectionConfig(
  config: ArcTableSectionConfig,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): boolean {
  if (!validateArcTableSectionConfig(config)) return false
  try {
    let sections: ArcTableSectionConfig[] = []
    const raw = storage.getItem(ARC_TABLE_SECTION_CONFIG_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSectionConfigs>
      if (parsed.schemaVersion === 1 && Array.isArray(parsed.sections)) sections = parsed.sections.filter(validateArcTableSectionConfig).map(copyConfig)
    }
    sections = [...sections.filter((candidate) => candidate.sectionId !== config.sectionId), copyConfig(config)]
    storage.setItem(ARC_TABLE_SECTION_CONFIG_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, sections } satisfies StoredSectionConfigs))
    return true
  } catch {
    return false
  }
}

function validateArcTableSectionConfig(value: unknown): value is ArcTableSectionConfig {
  if (!value || typeof value !== 'object') return false
  const config = value as ArcTableSectionConfig
  if (!config.sectionId?.trim() || !Array.isArray(config.roster) || !Array.isArray(config.passDefinitions)) return false
  const rosterIds = new Set<string>(); const rosterNames = new Set<string>()
  for (const person of config.roster) {
    const name = person?.name?.trim().toLocaleLowerCase()
    if (!person?.id || !name || rosterIds.has(person.id) || rosterNames.has(name)) return false
    rosterIds.add(person.id); rosterNames.add(name)
  }
  const passIds = new Set<string>(); const passNames = new Set<string>()
  for (const pass of config.passDefinitions) {
    const label = pass?.label?.trim().toLocaleLowerCase()
    if (!pass?.id || !label || passIds.has(pass.id) || passNames.has(label)) return false
    passIds.add(pass.id); passNames.add(label)
  }
  return true
}

function copyConfig(config: ArcTableSectionConfig): ArcTableSectionConfig {
  return {
    sectionId: config.sectionId,
    roster: config.roster.map((person) => ({ ...person })),
    passDefinitions: config.passDefinitions.map((pass) => ({ ...pass })),
  }
}
