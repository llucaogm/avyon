function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

/**
 * Minimal, safe markdown-lite for note content: **bold**, "- "/"• " lines become a
 * list, "> " lines become a quote, blank lines are skipped, everything else is a
 * paragraph. Safe to use with dangerouslySetInnerHTML because every character of the
 * input is HTML-escaped FIRST — the markup below is only ever injected around
 * already-escaped text, never around raw user input.
 */
export function formatNoteText(texto: string | null | undefined): string {
  if (!texto) return ''

  const linhas = escapeHtml(texto).split('\n')
  let out = ''
  let emLista = false

  for (let linha of linhas) {
    linha = linha.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    if (/^\s*[-•]\s+/.test(linha)) {
      if (!emLista) {
        out += '<ul>'
        emLista = true
      }
      out += '<li>' + linha.replace(/^\s*[-•]\s+/, '') + '</li>'
      continue
    }
    if (emLista) {
      out += '</ul>'
      emLista = false
    }

    if (/^\s*>\s?/.test(linha)) {
      out += '<blockquote>' + linha.replace(/^\s*>\s?/, '') + '</blockquote>'
      continue
    }
    if (linha.trim() === '') continue
    out += '<p>' + linha + '</p>'
  }

  if (emLista) out += '</ul>'
  return out
}
