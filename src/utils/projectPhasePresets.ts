export const standardProjectPhasePresets = [
  { name: '予備検討', durationWeeks: 1, toneKey: 'preStudy' },
  { name: '基礎検討', durationWeeks: 2, toneKey: 'discovery' },
  { name: '基本設計', durationWeeks: 2, toneKey: 'basicDesign' },
  { name: '詳細設計', durationWeeks: 2, toneKey: 'detailDesign' },
  { name: 'CT', durationWeeks: 1, toneKey: 'ct' },
  { name: 'ITa', durationWeeks: 1, toneKey: 'ita' },
  { name: 'ITb', durationWeeks: 1, toneKey: 'itb' },
  { name: 'UAT', durationWeeks: 1, toneKey: 'uat' },
  { name: '移行', durationWeeks: 1, toneKey: 'migration' },
] as const

export type StandardProjectPhaseName = (typeof standardProjectPhasePresets)[number]['name']
export type PhaseToneKey = (typeof standardProjectPhasePresets)[number]['toneKey'] | 'defaultTone'

export const defaultStandardProjectPhaseNames: StandardProjectPhaseName[] = standardProjectPhasePresets.map(
  (phase) => phase.name,
)

const phaseToneMap = new Map(standardProjectPhasePresets.map((phase) => [phase.name, phase.toneKey]))

export function getPhaseToneKey(phaseName: string): PhaseToneKey {
  return phaseToneMap.get(phaseName as StandardProjectPhaseName) ?? 'defaultTone'
}
