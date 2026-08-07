import {
  Dumbbell,
  BookOpen,
  Droplet,
  Moon,
  Brain,
  Heart,
  Zap,
  Leaf,
  Footprints,
  Activity,
  Pill,
  type LucideIcon,
} from 'lucide-react'

export const HABIT_ICONS: Record<string, LucideIcon> = {
  Dumbbell,
  BookOpen,
  Droplet,
  Moon,
  Brain,
  Heart,
  Zap,
  Leaf,
  Footprints,
  Activity,
  Pill,
}

export const HABIT_ICON_NAMES = Object.keys(HABIT_ICONS)

/** The keys above are lucide-react's own (English) component names, stored as-is in
 * habits.icone — this only translates what's shown in the icon picker. */
export const HABIT_ICON_LABELS: Record<string, string> = {
  Dumbbell: 'Academia',
  BookOpen: 'Leitura',
  Droplet: 'Água',
  Moon: 'Sono',
  Brain: 'Mente',
  Heart: 'Saúde',
  Zap: 'Energia',
  Leaf: 'Bem-estar',
  Footprints: 'Corrida',
  Activity: 'Atividade física',
  Pill: 'Suplementos',
}

export function getHabitIcon(name: string | null): LucideIcon {
  return (name && HABIT_ICONS[name]) || Zap
}

export function getHabitIconLabel(name: string): string {
  return HABIT_ICON_LABELS[name] ?? name
}
