import type { CSSProperties, ReactNode } from 'react'
import {
  BookOpen,
  Tags,
  Receipt,
  PiggyBank,
  LayoutDashboard,
  Shield,
  Target,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { TipBox, ExampleBox } from '@/modules/financeiro/components/help/TipBox'

const chapters = [
  { id: 'introducao', label: 'Introdução', icon: BookOpen },
  { id: 'categorias', label: '1. Categorias', icon: Tags },
  { id: 'lancamentos', label: '2. Lançamentos', icon: Receipt },
  { id: 'orcamento', label: '3. Orçamento', icon: PiggyBank },
  { id: 'inicio', label: '4. Início (Dashboard)', icon: LayoutDashboard },
  { id: 'reserva', label: '5. Reserva de Emergência', icon: Shield },
  { id: 'metas', label: '6. Metas', icon: Target },
  { id: 'projecao', label: '7. Projeção Futura', icon: TrendingUp },
  { id: 'faq', label: 'Perguntas frequentes', icon: HelpCircle },
]

export default function HowToUsePage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="font-display text-2xl font-semibold">Como usar o Controle Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Um guia rápido, do começo ao fim, pra você tirar o máximo proveito do app.
        </p>
      </div>

      <Card className="animate-fade-in-up">
        <CardContent className="py-4">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Índice
          </p>
          <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {chapters.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="press-feedback flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      <section id="introducao" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={BookOpen}>Introdução</SectionTitle>
        <Prose>
          <p>
            Esse app nasceu da sua planilha de controle financeiro — a ideia é a mesma, só que mais
            rápido de usar no dia a dia e funcionando também no celular.
          </p>
          <p>
            A base de tudo são só <strong>duas peças</strong>: o que você <strong>planeja</strong>{' '}
            gastar/receber todo mês (as <strong>Categorias</strong>) e o que <strong>de fato</strong>{' '}
            aconteceu, dia a dia (os <strong>Lançamentos</strong>). Todas as outras telas — Orçamento,
            Início, Projeção — são só formas diferentes de olhar pra essas duas coisas.
          </p>
        </Prose>
        <TipBox>
          Se você entender bem essa distinção — <strong>Categoria = plano</strong>,{' '}
          <strong>Lançamento = realidade</strong> — o resto do app faz sentido sozinho.
        </TipBox>
      </section>

      <section id="categorias" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={Tags}>1. Categorias</SectionTitle>
        <Prose>
          <p>
            É onde você cadastra seus tipos de despesa e receita — uma vez só (ou de vez em quando,
            quando algo muda). Pense nelas como "gavetas" onde os lançamentos do dia a dia vão parar.
          </p>
          <p>
            Toda categoria de despesa tem um <strong>Grupo</strong> (Fixo, Variável, Objetivo ou
            Reserva), um <strong>Valor mensal</strong> (o "Previsto") e uma{' '}
            <strong>Frequência</strong>.
          </p>
        </Prose>

        <h3 className="mt-2 text-sm font-semibold">O valor não é obrigatório representar a realidade</h3>
        <Prose>
          <p>
            Se a categoria é pra algo que varia muito (tipo Transporte: uber, gasolina, ônibus), você
            pode deixar o valor em <strong>R$ 0</strong>. Ela vai funcionar só como uma etiqueta pra
            organizar seus lançamentos, sem cobrar de você nenhum "orçamento" fixo.
          </p>
        </Prose>
        <ExampleBox>
          Categoria <strong>"Transporte"</strong>, grupo Variável, valor R$ 0. Toda vez que pegar um
          Uber ou abastecer, você lança em Lançamentos escolhendo essa categoria — sem se preocupar
          com limite nenhum.
        </ExampleBox>

        <h3 className="mt-2 text-sm font-semibold">Frequência — só importa pra Projeção</h3>
        <Prose>
          <p>
            A Frequência (Mensal, Anual, Semestral, Único) só é usada na aba <strong>Projeção</strong>{' '}
            (o cálculo dos próximos 12 meses). Ela não muda nada no Orçamento nem no Início. Se o
            valor da categoria for R$ 0, a frequência não faz diferença nenhuma na prática.
          </p>
        </Prose>

        <h3 className="mt-2 text-sm font-semibold">"Termina em" — pra contas com prazo</h3>
        <Prose>
          <p>
            Empréstimos e financiamentos costumam ter uma data pra acabar. Preencha o campo{' '}
            <strong>"Termina em"</strong> com o mês em que a última parcela é paga — a partir do mês
            seguinte, o app para de contar esse valor automaticamente (no Orçamento, no Início e na
            Projeção).
          </p>
        </Prose>
        <ExampleBox>
          Categoria <strong>"Empréstimo X"</strong>, grupo Fixo, valor R$ 600, frequência Mensal,
          "Termina em" = 15/10/2026. De novembro de 2026 em diante, ele some sozinho das contas.
        </ExampleBox>
      </section>

      <section id="lancamentos" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={Receipt}>2. Lançamentos</SectionTitle>
        <Prose>
          <p>
            É o registro do dia a dia — <strong>tudo</strong> que entra ou sai de dinheiro, não
            importa se é fixo, variável, ou avulso. Use o botão flutuante <strong>+</strong> (Novo
            lançamento) pra registrar rápido: valor, descrição, categoria (o app já sugere uma com
            base no que você já lançou antes), data e forma de pagamento.
          </p>
        </Prose>
        <TipBox>
          Ter uma categoria cadastrada com um valor previsto <strong>não lança nada sozinho</strong>.
          Se você não registrar o gasto real em Lançamentos, o Realizado do Orçamento continua em
          R$ 0 — mesmo que o Previsto já esteja lá.
        </TipBox>
      </section>

      <section id="orcamento" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={PiggyBank}>3. Orçamento</SectionTitle>
        <Prose>
          <p>
            Compara, categoria por categoria, o <strong>Previsto</strong> (o que você cadastrou) com
            o <strong>Realizado</strong> (a soma dos lançamentos daquele mês). Só fica vermelho quando
            existe um Previsto de verdade e você já passou dele.
          </p>
        </Prose>

        <h3 className="mt-2 text-sm font-semibold">A caixinha "Pago?"</h3>
        <Prose>
          <p>
            É um lembrete manual, separado do cálculo — "esse boleto eu já paguei de fato?". Marcar
            ou desmarcar não muda o Realizado, que sempre vem dos lançamentos.
          </p>
        </Prose>

        <h3 className="mt-2 text-sm font-semibold">Confirmar pagamento / recebimento</h3>
        <Prose>
          <p>
            Pra contas fixas mensais (aluguel, empréstimo, assinaturas, salário), aparece um botão de
            atalho quando ainda não tem nenhum lançamento no mês — um clique já registra o valor
            exato, na data de hoje, sem precisar abrir o lançamento rápido e digitar tudo de novo.
          </p>
        </Prose>
      </section>

      <section id="inicio" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={LayoutDashboard}>4. Início (Dashboard)</SectionTitle>
        <Prose>
          <p>
            A tela de resumo. Três números merecem atenção especial:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Renda líquida</strong> — soma automática das suas receitas cadastradas. Não
              precisa relançar o salário todo mês pra esse número aparecer certo.
            </li>
            <li>
              <strong>Saldo do mês</strong> — renda líquida menos o que você já gastou nesse mês.
              Reinicia todo mês.
            </li>
            <li>
              <strong>Saldo atual</strong> — tenta representar o que você tem de verdade na conta.
              Funciona num modelo híbrido, explicado abaixo.
            </li>
          </ul>
        </Prose>

        <h3 className="mt-2 text-sm font-semibold">Como o Saldo atual funciona</h3>
        <Prose>
          <p>
            De vez em quando, você abre a engrenagem ⚙️ e digita o saldo real da sua conta (olhando o
            extrato do banco). A partir daí, o app soma sozinho tudo que você for lançando (entradas
            menos saídas) em cima desse valor — sem você precisar atualizar de novo toda hora.
          </p>
          <p>
            Quando quiser conferir se ainda está batendo com o banco, é só reabrir a engrenagem e
            digitar o valor real de novo — isso vira o novo ponto de partida. A legenda embaixo do
            número mostra quando foi a última conferência.
          </p>
        </Prose>
        <TipBox>
          Esse número só fica preciso se você for lançando as coisas em Lançamentos. Ele não
          substitui olhar o extrato de vez em quando — serve pra você não precisar fazer isso todo
          dia.
        </TipBox>
      </section>

      <section id="reserva" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={Shield}>5. Reserva de Emergência</SectionTitle>
        <Prose>
          <p>
            Defina quanto você gasta por mês em coisas essenciais e quantos meses de reserva quer ter
            guardado — o app calcula a meta total sozinho. Registre aportes conforme for guardando
            dinheiro, e acompanhe o progresso e o histórico acumulado.
          </p>
        </Prose>
      </section>

      <section id="metas" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={Target}>6. Metas</SectionTitle>
        <Prose>
          <p>
            Pra objetivos com valor e prazo definidos — viagem, troca de carro, reforma. Cadastre o
            valor total e em quantos meses quer chegar lá; o app calcula quanto precisa guardar por
            mês. Registre quanto já guardou conforme for juntando.
          </p>
        </Prose>
      </section>

      <section id="projecao" className="flex flex-col gap-3 scroll-mt-4">
        <SectionTitle icon={TrendingUp}>7. Projeção Futura</SectionTitle>
        <Prose>
          <p>
            Mostra os próximos 12 meses, calculados a partir das suas categorias e do seu saldo
            atual — sem você precisar preencher nada a mais. Ela respeita a Frequência (mensal, anual,
            semestral, único) e o campo "Termina em" de cada categoria.
          </p>
        </Prose>
      </section>

      <section id="faq" className="flex flex-col gap-4 scroll-mt-4">
        <SectionTitle icon={HelpCircle}>Perguntas frequentes</SectionTitle>

        <FaqItem index={0} question="Preciso relançar meu salário todo mês?">
          Não. A Renda líquida já soma automaticamente o valor cadastrado na categoria de receita.
          Lançar o recebimento é opcional — só ajuda a manter o Saldo atual e o histórico de
          Lançamentos mais fiéis ao dia a dia.
        </FaqItem>

        <FaqItem index={1} question="Criei uma categoria mas não sei que valor colocar. Posso deixar 0?">
          Sim. Categorias com valor 0 funcionam como uma etiqueta pra organizar seus lançamentos, sem
          representar um orçamento fixo.
        </FaqItem>

        <FaqItem index={2} question="A Frequência da categoria muda alguma coisa no Orçamento?">
          Não. Ela só é usada na aba Projeção, pra saber em quais meses futuros aquele valor deve ser
          contado.
        </FaqItem>

        <FaqItem index={3} question="Cadastrei uma despesa fixa mas o Orçamento mostra Realizado R$ 0. Por quê?">
          Cadastrar a categoria só define o Previsto. O Realizado só aparece depois que você registra
          o gasto de verdade — em Lançamentos, ou usando o botão "Confirmar pagamento" na aba
          Orçamento.
        </FaqItem>

        <FaqItem index={4} question="Por que o Saldo atual está diferente do meu banco?">
          Ele só soma o que foi lançado no app desde a última vez que você confirmou o saldo real na
          engrenagem. Se algo não foi lançado (ou você nunca confirmou o saldo), o número vai
          divergir. Basta abrir a engrenagem e atualizar com o valor do extrato.
        </FaqItem>
      </section>

      <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
        <ArrowRight className="size-3.5" />
        Dúvida que não está aqui? É só perguntar.
      </div>
    </div>
  )
}

interface SectionTitleProps {
  icon: LucideIcon
  children: string
}

function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h2 className="font-display text-lg font-semibold">{children}</h2>
    </div>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/90">{children}</div>
}

function FaqItem({
  question,
  children,
  index,
}: {
  question: string
  children: ReactNode
  index: number
}) {
  return (
    <Card className="animate-fade-in-up" style={{ '--stagger-index': index } as CSSProperties}>
      <CardContent className="flex flex-col gap-1.5 py-4">
        <p className="text-sm font-medium">{question}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  )
}
