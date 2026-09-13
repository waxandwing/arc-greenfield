import {
  ARC_TABLE_SECTION_CONFIG_STORAGE_KEY,
  loadArcTableSectionConfig,
  saveArcTableSectionConfig,
} from './arcTableSectionConfig'

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}

const p4 = loadArcTableSectionConfig('section-p4', storage)
p4.roster = [{ id: 'person-maya', name: 'Maya Chen' }]
p4.passDefinitions.push({ id: 'office-pass', label: 'Office' })
if (!saveArcTableSectionConfig(p4, storage)) throw new Error('Section classroom configuration must save.')

const restoredP4 = loadArcTableSectionConfig('section-p4', storage)
if (restoredP4.roster[0]?.name !== 'Maya Chen' || !restoredP4.passDefinitions.some((pass) => pass.label === 'Office')) throw new Error('Reusable roster and pass definitions must persist for the same Section.')

const p6 = loadArcTableSectionConfig('section-p6', storage)
if (p6.roster.length !== 0 || p6.passDefinitions.some((pass) => pass.label === 'Office')) throw new Error('One Section must not inherit another Section’s roster or pass configuration.')

memory.set(ARC_TABLE_SECTION_CONFIG_STORAGE_KEY, '{broken')
if (loadArcTableSectionConfig('section-p4', storage).roster.length !== 0) throw new Error('Malformed Section configuration must fail closed to safe defaults.')

console.log('ArcTable reusable Section roster and pass configuration contract passed')
