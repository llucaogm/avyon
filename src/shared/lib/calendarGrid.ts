/** Portado de hub-pessoal/src/components/PostCalendar.jsx — grade mensal de
 * 7 colunas (dom-sáb), com `null` de padding antes do dia 1 e depois do
 * último dia, sempre múltiplo de 7 pra fechar linhas completas. */
export function monthMatrix(year: number, month: number): (number | null)[] {
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
