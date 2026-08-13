import type { Enums } from '@/shared/types/database.types'

export type PostPlataforma = Enums<'post_plataforma'>
export type PostTipo = Enums<'post_tipo'>
export type PostStatus = Enums<'post_status'>

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
