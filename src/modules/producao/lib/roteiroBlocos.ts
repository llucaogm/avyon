export interface RoteiroBloco {
  id: string
  nome: string
  tempo: string
  fala: string
  visual: string
}

let counter = 0
function novoBlocoId(): string {
  counter += 1
  return `b${Date.now()}${counter}`
}

export function novoBloco(nome = ''): RoteiroBloco {
  return { id: novoBlocoId(), nome, tempo: '', fala: '', visual: '' }
}

/** Todo roteiro novo já vem com esses 3 — renomeáveis, reordenáveis, removíveis. */
export function blocosPadrao(): RoteiroBloco[] {
  return [novoBloco('Hook'), novoBloco('Desenvolvimento'), novoBloco('CTA')]
}
