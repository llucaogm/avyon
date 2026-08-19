import { createClient } from 'npm:@supabase/supabase-js@2'

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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { error: insertError } = await admin.from('referencias').insert({
      user_id: OWNER_USER_ID,
      titulo: dados.titulo || url,
      url,
      plataforma,
      thumbnail_url: dados.thumbnail_url,
      autor: dados.autor,
      cor: COR_PADRAO,
    })
    if (insertError) throw insertError

    return json({ ok: true, plataforma, titulo: dados.titulo || url }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao salvar referência' }, 500)
  }
})
