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

export function getHabitIcon(name: string | null): LucideIcon {
  return (name && HABIT_ICONS[name]) || Zap
}
