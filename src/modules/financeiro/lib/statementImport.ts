import type { Tables } from '@/shared/types/database.types'

export interface ParsedTransaction {
  data: string
  descricao: string
  valor: number
  tipo: 'entrada' | 'saida'
  fitid: string | null
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^\\r\\n<]*)`, 'i'))
  return match ? match[1].trim() : null
}

function formatOfxDate(raw: string): string | null {
  const digits = raw.slice(0, 8)
  if (!/^\d{8}$/.test(digits)) return null
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/**
 * OFX bank-statement exports are a narrow, well-known subset of SGML — repeated
 * <STMTTRN> blocks with a handful of leaf tags, never arbitrary nesting — so a
 * regex extraction is enough and avoids pulling in a Node-oriented OFX/XML parser
 * that may not bundle cleanly for the browser.
 */
export function parseOfx(texto: string): ParsedTransaction[] {
  const blocks = texto.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? []
  const result: ParsedTransaction[] = []

  for (const block of blocks) {
    const dtPosted = extractTag(block, 'DTPOSTED')
    const trnAmt = extractTag(block, 'TRNAMT')
    if (!dtPosted || !trnAmt) continue

    const data = formatOfxDate(dtPosted)
    if (!data) continue

    const valorNum = Number(trnAmt.replace(',', '.'))
    if (Number.isNaN(valorNum) || valorNum === 0) continue

    const memo = extractTag(block, 'MEMO')
    const name = extractTag(block, 'NAME')

    result.push({
      data,
      descricao: memo || name || 'Transação importada',
      valor: Math.abs(valorNum),
      tipo: valorNum < 0 ? 'saida' : 'entrada',
      fitid: extractTag(block, 'FITID'),
    })
  }

  return result
}

/**
 * Heuristic dedup against what's already logged — same data + same valor (entrada
 * or saída matching tipo). No FITID persisted anywhere yet, so this can't be
 * perfect (a real coincidence of same-day same-amount stays possible), but it
 * covers the common case of re-importing an overlapping date range.
 */
export function marcarProvaveisDuplicatas<T extends ParsedTransaction>(
  parsed: T[],
  existentes: Pick<Tables<'transactions'>, 'data' | 'valor_entrada' | 'valor_saida'>[],
): (T & { provavelDuplicata: boolean })[] {
  return parsed.map((p) => {
    const provavelDuplicata = existentes.some((e) => {
      const valorExistente = p.tipo === 'entrada' ? e.valor_entrada : e.valor_saida
      return e.data === p.data && valorExistente === p.valor
    })
    return { ...p, provavelDuplicata }
  })
}
