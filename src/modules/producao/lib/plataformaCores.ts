import type { Enums } from '@/shared/types/database.types'

export type PostPlataforma = Enums<'post_plataforma'>
export type PostTipo = Enums<'post_tipo'>
export type PostStatus = Enums<'post_status'>
export type PostAprovacao = Enums<'post_aprovacao'>

export const PLATAFORMA_ORDER: readonly PostPlataforma[] = ['instagram', 'tiktok', 'youtube', 'linkedin', 'outro']

export const PLATAFORMA_LABELS: Record<PostPlataforma, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  outro: 'Outro',
}

/** Cor de marca de cada plataforma — fato público (não é o logo), só pros
 * pontinhos do calendário e badges, mesmo raciocínio de bancoPresets.ts em Cartões. */
export const PLATAFORMA_CORES: Record<PostPlataforma, string> = {
  instagram: '#E1306C',
  tiktok: '#25F4EE',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  outro: 'var(--muted-foreground)',
}

export const TIPO_ORDER: readonly PostTipo[] = ['reels', 'video', 'carrossel', 'estatico', 'stories']

export const TIPO_LABELS: Record<PostTipo, string> = {
  estatico: 'Estático',
  carrossel: 'Carrossel',
  reels: 'Reels',
  video: 'Vídeo',
  stories: 'Stories',
}

export const STATUS_ORDER: readonly PostStatus[] = ['ideia', 'roteiro', 'gravacao', 'edicao', 'agendado', 'publicado']

export const STATUS_LABELS: Record<PostStatus, string> = {
  ideia: 'Ideia',
  roteiro: 'Roteiro',
  gravacao: 'Gravação',
  edicao: 'Edição',
  agendado: 'Agendado',
  publicado: 'Publicado',
}

/** Cada status ganha um ponto no ramp teal→blue existente, do "ainda não
 * começou" (muted) até "no ar" (primary) — reaproveita os tokens já validados
 * em vez de inventar cor nova. */
export const STATUS_CORES: Record<PostStatus, string> = {
  ideia: 'var(--muted-foreground)',
  roteiro: 'var(--chart-5)',
  gravacao: 'var(--chart-4)',
  edicao: 'var(--chart-3)',
  agendado: 'var(--chart-2)',
  publicado: 'var(--primary)',
}

export const APROVACAO_ORDER: readonly PostAprovacao[] = ['esperando', 'aprovado', 'reprovado']

export const APROVACAO_LABELS: Record<PostAprovacao, string> = {
  esperando: 'Esperando aprovação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

/** Classes Tailwind (não CSS var) porque aqui é fundo/borda de card inteiro,
 * não um pontinho — precisa das variantes claro/escuro do próprio Tailwind. */
export const APROVACAO_CARD_CLASSES: Record<PostAprovacao, string> = {
  esperando: 'bg-amber-50/70 ring-amber-200/60 dark:bg-amber-950/20 dark:ring-amber-900/40',
  aprovado: 'bg-green-50 ring-green-300/60 dark:bg-green-950/30 dark:ring-green-900/50',
  reprovado: 'bg-red-50 ring-red-300/60 dark:bg-red-950/30 dark:ring-red-900/50',
}

export const APROVACAO_TRIGGER_CLASSES: Record<PostAprovacao, string> = {
  esperando: 'border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300',
  aprovado: 'border-green-400 text-green-800 dark:border-green-700 dark:text-green-300',
  reprovado: 'border-red-400 text-red-800 dark:border-red-700 dark:text-red-300',
}
