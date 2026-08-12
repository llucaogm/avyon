import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/shared/lib/supabaseClient'
import { useLogger } from '@/shared/hooks/useLogger'
import { getErrorMessage } from '@/shared/lib/errors'
import { Input } from '@/shared/components/ui/input'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/shared/components/ui/card'
import { AuroraBackground } from '@/shared/components/effects/AuroraBackground'
import avyonLogo from '@/assets/avyon-logo.png'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const log = useLogger()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    // Never pass `values` itself to the logger — it holds the raw password.
    // Only a fixed action tag goes into the log, never form contents.
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(values)
        if (error) throw error
        navigate('/')
      } else {
        const { error, data } = await supabase.auth.signUp(values)
        if (error) throw error
        if (data.session) {
          navigate('/')
        } else {
          toast.success('Verifique seu e-mail para confirmar o cadastro.')
        }
      }
    } catch (err) {
      log.error(mode === 'login' ? 'auth.sign_in' : 'auth.sign_up', {}, err)
      toast.error(getErrorMessage(err, 'Algo deu errado'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuroraBackground />
      <Card className="animate-fade-in-up relative z-10 w-full max-w-sm border-white/10 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <img src={avyonLogo} alt="Avyon" className="animate-pop-in mx-auto mb-2 h-12 w-auto" />
          <CardDescription>
            {mode === 'login' ? 'Entre para acessar seu hub' : 'Crie sua conta gratuita'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
            </FormField>
            <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...register('password')}
              />
            </FormField>
            <SubmitButton pending={submitting} className="mt-2">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </SubmitButton>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="press-feedback mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === 'login'
              ? 'Não tem conta? Cadastre-se'
              : 'Já tem conta? Entrar'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
