/** "@" no autor mesmo se o dado salvo já vier sem — formatação pura,
 * compartilhada entre a linha da lista e a folha de detalhe. */
export function formatHandle(autor: string): string {
  return autor.startsWith('@') ? autor : `@${autor}`
}
