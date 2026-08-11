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

const MAX_NOTAS = 15

const SYSTEM_PROMPT = `Você organiza anotações de estudo em um mapa mental. Leia todas as anotações dadas e sintetize um tema central que conecte elas, com ramos principais (os grandes temas), pontos dentro de cada ramo, e pequenos detalhes/exemplos como itens finais. Não repita o texto literal das anotações — sintetize e organize. Responda em português.`

const MIND_MAP_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string', description: 'Tema central que conecta todas as anotações' },
    ramos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          pontos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                detalhes: { type: 'array', items: { type: 'string' } },
              },
              required: ['titulo', 'detalhes'],
              additionalProperties: false,
            },
          },
        },
        required: ['titulo', 'pontos'],
        additionalProperties: false,
      },
    },
  },
  required: ['titulo', 'ramos'],
  additionalProperties: false,
} as const

interface FlatMindMap {
  titulo: string
  ramos: { titulo: string; pontos: { titulo: string; detalhes: string[] }[] }[]
}

interface MindMapNode {
  titulo: string
  filhos: MindMapNode[]
}

function toMindMapNode(flat: FlatMindMap): MindMapNode {
  return {
    titulo: flat.titulo,
    filhos: flat.ramos.map((ramo) => ({
      titulo: ramo.titulo,
      filhos: ramo.pontos.map((ponto) => ({
        titulo: ponto.titulo,
        filhos: ponto.detalhes.map((detalhe) => ({ titulo: detalhe, filhos: [] })),
      })),
    })),
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

    const { notaIds, mapaId } = (await req.json()) as { notaIds?: string[]; mapaId?: string }
    if (!notaIds || notaIds.length === 0) return json({ error: 'Selecione ao menos uma anotação' }, 400)
    if (notaIds.length > MAX_NOTAS) return json({ error: `Selecione no máximo ${MAX_NOTAS} anotações` }, 400)

    const { data: notas, error: notasError } = await supabase
      .from('notas')
      .select('titulo, tipo, conteudo, resumo, chaves')
      .in('id', notaIds)
    if (notasError) throw notasError
    if (!notas || notas.length === 0) return json({ error: 'Nenhuma anotação encontrada' }, 400)

    const notasTexto = notas
      .map((n, i) => {
        const partes = [
          n.conteudo,
          n.resumo,
          n.chaves.length ? `Pontos-chave: ${n.chaves.join('; ')}` : null,
        ].filter(Boolean)
        return `Anotação ${i + 1} — ${n.titulo} (${n.tipo}):\n${partes.join('\n') || '(sem conteúdo)'}`
      })
      .join('\n\n---\n\n')

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: MIND_MAP_SCHEMA } },
      messages: [{ role: 'user', content: notasTexto }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Resposta sem conteúdo de texto')
    const flat = JSON.parse(textBlock.text) as FlatMindMap
    const conteudo = toMindMapNode(flat)

    if (mapaId) {
      const { data: mapa, error: updateError } = await supabase
        .from('mapas_mentais')
        .update({ conteudo, nota_ids: notaIds, updated_at: new Date().toISOString() })
        .eq('id', mapaId)
        .select('*')
        .single()
      if (updateError) throw updateError
      return json({ mapa }, 200)
    }

    const { data: mapa, error: insertError } = await supabase
      .from('mapas_mentais')
      .insert({ user_id: user.id, titulo: flat.titulo, nota_ids: notaIds, conteudo })
      .select('*')
      .single()
    if (insertError) throw insertError

    return json({ mapa }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao gerar o mapa mental' }, 500)
  }
})
