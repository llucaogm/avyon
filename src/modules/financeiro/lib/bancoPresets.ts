export interface BancoPreset {
  id: string
  nome: string
  cor: string
}

/** Cor de marca de bancos/fintechs comuns no Brasil — usada só pra pré-preencher
 * nome+cor ao criar um cartão (a cor de uma marca é um fato público, não uma
 * reprodução do logo). O cartão renderizado é uma composição própria (chip +
 * nome em tipografia própria da Avyon), não o logo oficial de ninguém. */
export const BANCO_PRESETS: BancoPreset[] = [
  { id: 'nubank', nome: 'Nubank', cor: '#8A05BE' },
  { id: 'itau', nome: 'Itaú', cor: '#EC7000' },
  { id: 'bradesco', nome: 'Bradesco', cor: '#CC092F' },
  { id: 'bb', nome: 'Banco do Brasil', cor: '#0033A0' },
  { id: 'caixa', nome: 'Caixa', cor: '#0070AD' },
  { id: 'santander', nome: 'Santander', cor: '#EC0000' },
  { id: 'inter', nome: 'Inter', cor: '#FF7A00' },
  { id: 'c6', nome: 'C6 Bank', cor: '#1A1A1A' },
  { id: 'picpay', nome: 'PicPay', cor: '#21C25E' },
  { id: 'btg', nome: 'BTG Pactual', cor: '#0B1F5C' },
  { id: 'mercadopago', nome: 'Mercado Pago', cor: '#00AAEF' },
]
