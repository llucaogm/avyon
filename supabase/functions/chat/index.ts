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

const SYSTEM_PROMPT = `Você é o assistente de estudos do Avyon. Ajuda a pessoa a entender, resumir e questionar textos que ela colar aqui — como se fosse uma conversa de verdade, não um resumo automático.

Você ainda não consegue abrir links sozinho. Se a pessoa colar uma URL, avise isso claramente e peça pra ela colar o texto relevante em vez do link.

Seja direto e útil. Responda em português.`

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

    const { conversaId, notaId, mensagem } = (await req.json()) as {
      conversaId?: string
      notaId?: string
      mensagem?: string
    }
    if (!mensagem?.trim()) return json({ error: 'Mensagem vazia' }, 400)

    let conversaIdFinal = conversaId
    if (!conversaIdFinal) {
      const { data, error } = await supabase
        .from('conversas')
        .insert({ user_id: user.id, nota_id: notaId ?? null, titulo: mensagem.slice(0, 80) })
        .select('id')
        .single()
      if (error) throw error
      conversaIdFinal = data.id
    }

    const { error: insertUserError } = await supabase.from('mensagens').insert({
      user_id: user.id,
      conversa_id: conversaIdFinal,
      role: 'user',
      conteudo: mensagem,
    })
    if (insertUserError) throw insertUserError

    const { data: historico, error: histError } = await supabase
      .from('mensagens')
      .select('role, conteudo')
      .eq('conversa_id', conversaIdFinal)
      .order('created_at', { ascending: true })
    if (histError) throw histError

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: historico.map((m) => ({
        role: m.role,
        content: m.conteudo,
      })),
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const resposta = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    const { error: insertAssistantError } = await supabase.from('mensagens').insert({
      user_id: user.id,
      conversa_id: conversaIdFinal,
      role: 'assistant',
      conteudo: resposta,
    })
    if (insertAssistantError) throw insertAssistantError

    await supabase
      .from('conversas')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversaIdFinal)

    return json({ conversaId: conversaIdFinal, resposta }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Erro ao processar mensagem' }, 500)
  }
})
