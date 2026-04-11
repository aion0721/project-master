import type { Phase, Project } from '../../types/project'
import { getPhaseToneKey } from '../../utils/projectPhasePresets'
import styles from '../projects/ProjectDetailPage.module.css'

export function getCurrentPhaseCardClassName(phase?: Phase) {
  if (!phase) {
    return undefined
  }

  switch (getPhaseToneKey(phase.name)) {
    case 'preStudy':
      return styles.metaCardPhaseTonePreStudy
    case 'discovery':
      return styles.metaCardPhaseToneDiscovery
    case 'basicDesign':
      return styles.metaCardPhaseToneBasicDesign
    case 'detailDesign':
      return styles.metaCardPhaseToneDetailDesign
    case 'ct':
      return styles.metaCardPhaseToneCt
    case 'ita':
      return styles.metaCardPhaseToneIta
    case 'itb':
      return styles.metaCardPhaseToneItb
    case 'uat':
      return styles.metaCardPhaseToneUat
    case 'migration':
      return styles.metaCardPhaseToneMigration
    case 'defaultTone':
    default:
      return styles.metaCardPhaseToneDefault
  }
}

export function getProjectStatusCardClassName(status?: Project['status']) {
  switch (status) {
    case '進行中':
      return styles.metaCardPhaseInProgress
    case '完了':
      return styles.metaCardPhaseCompleted
    case '遅延':
      return styles.metaCardPhaseDelayed
    case '中止':
      return styles.metaCardStatusCancelled
    case '未着手':
    default:
      return styles.metaCardPhaseNotStarted
  }
}
