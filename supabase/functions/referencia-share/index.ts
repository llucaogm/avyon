import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-share-token',
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

/** Duplicado de supabase/functions/oembed/index.ts — cada Edge Function é
 * autocontida (sem import compartilhado entre deploys separados). */
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
}

const EMPTY_OG: OgFields = { title: null, description: null, image: null }

/** Instagram/Facebook servem og:title/og:description/og:image pra qualquer
 * rastreador (mesmo mecanismo do preview de link do WhatsApp/Messenger). */
async function fetchOgTags(url: string): Promise<OgFields> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
    })
    if (!res.ok) return EMPTY_OG
    const html = await res.text()
    return {
      title: extractMeta(html, 'og:title'),
      description: extractMeta(html, 'og:description'),
      image: extractMeta(html, 'og:image'),
    }
  } catch {
    return EMPTY_OG
  }
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

// Mesmo primeiro tom de CATEGORIA_COLORS (src/modules/financeiro/lib/categoriaColors.ts)
// — a function não importa código do front, então fica hard-coded aqui.
const COR_PADRAO = '#3987e5'

// UUID real do único usuário do app — fixo em vez de resolver via
// auth.admin.listUsers()[0], que pegou uma segunda conta (sobra de teste)
// antes da conta real numa execução passada e atribuiu linhas ao dono errado.
const OWNER_USER_ID = '873b1ffb-506b-4ae1-af46-8e1fd6f7ec7a'

/**
 * Endpoint pensado pra ser chamado por um Atalho do iOS (Share Sheet), não pelo
 * app — por isso não usa a sessão Supabase do usuário (um Atalho não consegue
 * manter uma sessão que expira). Autentica com um segredo fixo (`x-share-token`,
 * comparado contra o secret `SHARE_TOKEN`).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const token = req.headers.get('x-share-token')
    if (!token || token !== Deno.env.get('SHARE_TOKEN')) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const { url } = (await req.json()) as { url?: string }
    if (!url?.trim()) return json({ error: 'URL vazia' }, 400)

    const plataforma = detectPlataforma(url)

    let dados = EMPTY_FIELDS
    if (plataforma === 'youtube') {
      dados = await fetchOembed(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    } else if (plataforma === 'tiktok') {
      dados = await fetchOembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
    }

    const og = await fetchOgTags(url)
    const thumbnail_url = dados.thumbnail_url ?? og.image
    const rawText = [og.title, og.description].filter(Boolean).join('\n')
    const enriquecido = await enrichWithClaude(rawText)
    const titulo = enriquecido?.titulo ?? dados.titulo ?? og.title ?? url

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { error: insertError } = await admin.from('referencias').insert({
      user_id: OWNER_USER_ID,
      titulo,
      url,
      plataforma,
      thumbnail_url,
      autor: dados.autor,
      tipo: enriquecido?.tipo ?? null,
      resumo: enriquecido?.resumo ?? null,
      cor: COR_PADRAO,
    })
    if (insertError) throw insertError

    return json({ ok: true, plataforma, titulo }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao salvar referência' }, 500)
  }
})
