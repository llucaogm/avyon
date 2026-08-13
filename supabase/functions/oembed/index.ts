import { createClient } from 'npm:@supabase/supabase-js@2'

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

    // Instagram e LinkedIn não têm oEmbed público (exigem app registrado + token)
    // — ficam com campos vazios de propósito, o front usa o fallback colorido.
    let dados = EMPTY_FIELDS
    if (plataforma === 'youtube') {
      dados = await fetchOembed(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    } else if (plataforma === 'tiktok') {
      dados = await fetchOembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
    }

    return json({ plataforma, ...dados }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao buscar preview' }, 500)
  }
})
