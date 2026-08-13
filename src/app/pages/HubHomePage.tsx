import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ListChecks, GraduationCap, Clapperboard, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'

const MODULES = [
  {
    to: '/financeiro',
    label: 'Financeiro',
    description: 'Categorias, lançamentos, orçamento e projeção.',
    icon: Wallet,
  },
  {
    to: '/habitos',
    label: 'Hábitos',
    description: 'Seu checklist diário e suas sequências.',
    icon: ListChecks,
  },
  {
    to: '/estudos',
    label: 'Estudos',
    description: 'Anotações do que você lê, vê e ouve.',
    icon: GraduationCap,
  },
  {
    to: '/producao',
    label: 'Produção',
    description: 'Calendário de postagens, roteiros e referências.',
    icon: Clapperboard,
  },
]

export default function HubHomePage() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-24 md:px-8 md:pb-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="font-display text-2xl font-semibold">Bem-vindo ao seu hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o que quer ver agora.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODULES.map(({ to, label, description, icon: Icon }, index) => (
            <Link key={to} to={to} className="press-feedback lift-on-hover block">
              <Card
                className="animate-fade-in-up h-full"
                style={{ '--stagger-index': index } as CSSProperties}
              >
                <CardContent className="flex flex-col gap-4 px-6 py-8">
                  <span className="bg-gradient-brand text-primary-foreground flex size-14 items-center justify-center rounded-full">
                    <Icon className="size-7" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <span className="text-primary flex items-center gap-1 text-sm font-medium">
                    Abrir <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
