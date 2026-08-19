/** Lista fixa usada tanto aqui (Select do form) quanto nas Edge Functions
 * (oembed, referencia-share) que pedem pra IA classificar — precisa ficar em
 * sincronia manual entre os dois lados, já que as functions não importam
 * código do front. */
export const TIPO_REFERENCIA_OPTIONS = [
  'Dica',
  'Inspiração',
  'Tutorial',
  'Estética',
  'Referência técnica',
  'Concorrente',
  'Outro',
] as const

export type TipoReferencia = (typeof TIPO_REFERENCIA_OPTIONS)[number]
