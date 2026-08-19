import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type Plataforma = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'outro'

function detectPlataforma(url: string): Plataforma {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') return 'youtube'
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok'
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram'
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin'
    return 'outro'
  } catch {
    return 'outro'
  }
}

interface OembedFields {
  titulo: string | null
  autor: string | null
  thumbnail_url: string | null
}

const EMPTY_FIELDS: OembedFields = { titulo: null, autor: null, thumbnail_url: null }

/** Cada provedor embrulhado no próprio try/catch — vídeo removido, rate limit ou
 * formato inesperado nunca derruba a function inteira, só volta campos vazios
 * e o front cai no card de fallback colorido. */
async function fetchOembed(endpoint: string): Promise<OembedFields> {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return EMPTY_FIELDS
    const data = await res.json()
    return {
      titulo: typeof data.title === 'string' ? data.title : null,
      autor: typeof data.author_name === 'string' ? data.author_name : null,
      thumbnail_url: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null,
    }
  } catch {
    return EMPTY_FIELDS
  }
}

/** O valor de content="..." vem com entidades HTML escapadas (og:image usa
 * &amp; entre os parâmetros da query string) — sem decodificar, a URL quebra
 * ao virar src de <img>, que não faz esse parsing sozinho. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = re.exec(html)
    if (m) return decodeHtmlEntities(m[1])
  }
  return null
}

interface OgFields {
  title: string | null
  description: string | null
  image: string | null
  autor: string | null
}

const EMPTY_OG: OgFields = { title: null, description: null, image: null, autor: null }

/** O og:url de um post do Instagram normalmente vem com o formato
 * /<usuario>/reel/<código>/ ou /<usuario>/p/<código>/ — dá pra extrair o @
 * do autor sem precisar de nenhuma API adicional. */
function extractInstagramHandle(ogUrl: string | null): string | null {
  if (!ogUrl) return null
  try {
    const segments = new URL(ogUrl).pathname.split('/').filter(Boolean)
    if (segments.length >= 2 && ['reel', 'reels', 'p', 'tv'].includes(segments[1])) {
      return `@${segments[0]}`
    }
    return null
  } catch {
    return null
  }
}

/** Instagram/Facebook servem og:title/og:description/og:image pra qualquer
 * rastreador — é assim que WhatsApp/Messenger geram preview de link. Usando o
 * mesmo User-Agent que o próprio ecossistema Meta reconhece pra isso, sem
 * precisar de login nem token. O bloqueio é intermitente, não permanente (o
 * mesmo link falha numa hora e funciona na próxima) — tenta até 3 vezes com
 * um intervalo curto antes de desistir; posts privados ou bloqueio persistente
 * só voltam campos vazios, nunca derrubam a function. */
async function fetchOgTags(url: string): Promise<OgFields> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        },
      })
      if (res.ok) {
        const html = await res.text()
        const result = {
          title: extractMeta(html, 'og:title'),
          description: extractMeta(html, 'og:description'),
          image: extractMeta(html, 'og:image'),
          autor: extractInstagramHandle(extractMeta(html, 'og:url')),
        }
        if (result.title || result.description || result.image) return result
      }
    } catch {
      // tenta de novo
    }
    if (tentativa < 2) await new Promise((resolve) => setTimeout(resolve, 700))
  }
  return EMPTY_OG
}

const TIPO_OPTIONS = ['Dica', 'Inspiração', 'Tutorial', 'Estética', 'Referência técnica', 'Concorrente', 'Outro']

const ENRICH_SYSTEM_PROMPT = `Você organiza referências salvas de vídeos/posts de redes sociais pra um criador de conteúdo. A partir do texto bruto dado (legenda, título ou descrição extraída do post), gere um título curto e claro, escolha o tipo mais adequado, e escreva um resumo objetivo de 2 a 4 frases sobre do que se trata. Responda em português.`

const ENRICH_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string', description: 'Título curto e claro pro card' },
    tipo: { type: 'string', enum: TIPO_OPTIONS },
    resumo: { type: 'string', description: '2 a 4 frases resumindo do que se trata' },
  },
  required: ['titulo', 'tipo', 'resumo'],
  additionalProperties: false,
} as const

interface Enriquecido {
  titulo: string
  tipo: string
  resumo: string
}

/** Só chama a IA se sobrou algum texto de verdade — nunca inventa conteúdo
 * a partir do nada. Falha (API fora, resposta inesperada) volta null e o
 * fluxo principal cai pros dados brutos que já tinha. */
async function enrichWithClaude(rawText: string): Promise<Enriquecido | null> {
  if (!rawText.trim()) return null
  try {
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: ENRICH_SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: ENRICH_SCHEMA } },
      messages: [{ role: 'user', content: rawText.slice(0, 4000) }],
    })
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null
    return JSON.parse(textBlock.text) as Enriquecido
  } catch (err) {
    console.error('enrichWithClaude falhou', err)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Não autenticado' }, 401)

    const { url } = (await req.json()) as { url?: string }
    if (!url?.trim()) return json({ error: 'URL vazia' }, 400)

    const plataforma = detectPlataforma(url)

    let dados = EMPTY_FIELDS
    if (plataforma === 'youtube') {
      dados = await fetchOembed(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    } else if (plataforma === 'tiktok') {
      dados = await fetchOembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
    }

    // og:tags como reforço — preenche o que o oEmbed deixou vazio (cobre
    // Instagram por completo, já que não tem oEmbed público nenhum).
    const og = await fetchOgTags(url)
    const titulo = dados.titulo ?? og.title
    const thumbnail_url = dados.thumbnail_url ?? og.image
    const rawText = [og.title, og.description].filter(Boolean).join('\n')

    const enriquecido = await enrichWithClaude(rawText)

    return json(
      {
        plataforma,
        titulo: enriquecido?.titulo ?? titulo,
        autor: dados.autor ?? og.autor,
        thumbnail_url,
        tipo: enriquecido?.tipo ?? null,
        resumo: enriquecido?.resumo ?? null,
      },
      200,
    )
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao buscar preview' }, 500)
  }
})
