import type { Enums } from '@/shared/types/database.types'

export type StudyColor = Enums<'study_color'>

export const STUDY_COLORS: StudyColor[] = ['teal', 'blue', 'amber', 'rose', 'violet', 'green']

export const STUDY_COLOR_LABELS: Record<StudyColor, string> = {
  teal: 'Verde-água',
  blue: 'Azul',
  amber: 'Âmbar',
  rose: 'Rosa',
  violet: 'Violeta',
  green: 'Verde',
}

export function studyColorVar(cor: StudyColor): string {
  return `var(--study-${cor})`
}

/** Next color in the palette, wrapping — used for "click swatch to cycle color". */
export function nextStudyColor(cor: StudyColor): StudyColor {
  const i = STUDY_COLORS.indexOf(cor)
  return STUDY_COLORS[(i + 1) % STUDY_COLORS.length]
}
