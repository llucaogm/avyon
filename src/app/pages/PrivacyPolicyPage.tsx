import { AuroraBackground } from '@/shared/components/effects/AuroraBackground'
import avyonLogo from '@/assets/avyon-logo.png'

/** Página pública (fora do ProtectedRoute) — precisa ser acessível sem login
 * pra servir de URL de política de privacidade em revisões de API de terceiros
 * (ex.: App Review da Meta pra permissão de oEmbed). */
export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <img src={avyonLogo} alt="Avyon" className="mb-8 h-10 w-auto" />
        <h1 className="text-2xl font-semibold text-foreground">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última atualização: agosto de 2026</p>

        <div className="prose prose-invert prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-base font-semibold text-foreground">O que é o Avyon</h2>
            <p>
              Avyon é um aplicativo pessoal de organização (finanças, hábitos, estudos e produção
              de conteúdo) usado por seu proprietário para gerenciar suas próprias informações.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Quais dados são armazenados</h2>
            <p>
              Os dados inseridos no Avyon (transações financeiras, anotações, referências de
              conteúdo, hábitos e afins) são armazenados de forma privada em um banco de dados
              (Supabase), acessível apenas pela conta autenticada do usuário. Nenhum dado é
              vendido, compartilhado ou usado para publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Processamento de links compartilhados (Instagram, TikTok, YouTube)
            </h2>
            <p>
              Quando o usuário salva um link de vídeo/post como referência, o Avyon busca
              metadados públicos da página (título, descrição e imagem de capa expostos
              publicamente pela própria plataforma de origem, como og:title/og:description/
              og:image ou oEmbed) para gerar automaticamente um título, categoria e resumo da
              referência salva. Esse processamento acontece de forma automatizada, sem
              intervenção humana, e usa apenas dados já públicos da própria URL informada pelo
              usuário — nenhum dado de login ou conta do Instagram é acessado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Uso de inteligência artificial</h2>
            <p>
              Algumas funcionalidades (geração de título/categoria/resumo de referências,
              assistente de estudos) enviam o texto relevante para a API da Anthropic (Claude)
              para processamento. Esses dados são usados apenas para gerar a resposta solicitada
              e não são usados para treinar modelos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Compartilhamento de dados</h2>
            <p>
              O Avyon não vende, aluga ou compartilha dados pessoais com terceiros para fins de
              marketing. Os dados só trafegam com os provedores estritamente necessários para o
              funcionamento do app (banco de dados Supabase, API da Anthropic para recursos de
              IA).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Contato</h2>
            <p>
              Dúvidas sobre esta política podem ser enviadas para{' '}
              <a href="mailto:lucaogm00@gmail.com" className="text-primary underline">
                lucaogm00@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
