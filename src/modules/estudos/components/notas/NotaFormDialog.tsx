import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { useMaterias } from '@/modules/estudos/hooks/useMaterias'
import { useCreateNota, useUpdateNota } from '@/modules/estudos/hooks/useNotas'
import { STUDY_COLORS, STUDY_COLOR_LABELS, studyColorVar } from '@/modules/estudos/lib/studyColors'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

const TIPOS = ['rascunho', 'livro', 'artigo', 'video', 'aula', 'podcast', 'ideia'] as const

const TIPO_LABELS: Record<(typeof TIPOS)[number], string> = {
  rascunho: 'Rascunho',
  livro: 'Livro',
  artigo: 'Artigo',
  video: 'Vídeo',
  aula: 'Aula',
  podcast: 'Podcast',
  ideia: 'Ideia',
}

const schema = z.object({
  titulo: z.string().min(1, 'Dê um título'),
  tipo: z.enum(TIPOS),
  materiaId: z.string().optional(),
  fonte: z.string().optional(),
  url: z.string().optional(),
  cor: z.enum(['teal', 'blue', 'amber', 'rose', 'violet', 'green']),
  conteudo: z.string().optional(),
  chaves: z.string().optional(),
  resumo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function defaultValuesFor(nota: Tables<'notas'> | undefined): FormValues {
  if (!nota) {
    return {
      titulo: '',
      tipo: 'rascunho',
      materiaId: undefined,
      fonte: '',
      url: '',
      cor: 'amber',
      conteudo: '',
      chaves: '',
      resumo: '',
    }
  }
  return {
    titulo: nota.titulo,
    tipo: nota.tipo,
    materiaId: nota.materia_id ?? undefined,
    fonte: nota.fonte ?? '',
    url: nota.url ?? '',
    cor: nota.cor,
    conteudo: nota.conteudo ?? '',
    chaves: (nota.chaves ?? []).join('\n'),
    resumo: nota.resumo ?? '',
  }
}

interface NotaFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  nota?: Tables<'notas'>
}

export function NotaFormDialog({ open, onOpenChange, nota }: NotaFormDialogProps) {
  const isEditing = !!nota
  const { data: materias = [] } = useMaterias()
  const createNota = useCreateNota()
  const updateNota = useUpdateNota()

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesFor(nota),
  })

  const cor = watch('cor')

  useEffect(() => {
    if (open) reset(defaultValuesFor(nota))
  }, [open, nota, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        titulo: values.titulo,
        tipo: values.tipo,
        materia_id: values.materiaId || null,
        fonte: values.fonte || null,
        url: values.url || null,
        cor: values.cor,
        conteudo: values.conteudo || null,
        chaves: (values.chaves ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
        resumo: values.resumo || null,
      }
      if (isEditing) {
        await updateNota.mutateAsync({ id: nota.id, values: payload })
        toast.success('Anotação salva')
      } else {
        await createNota.mutateAsync(payload)
        toast.success('Anotação criada')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar anotação'))
    }
  }

  const isSubmitting = createNota.isPending || updateNota.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar anotação' : 'Nova anotação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="O que essa anotação responde?" {...register('titulo')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Origem" htmlFor="tipo">
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Matéria" htmlFor="materiaId">
              <Controller
                control={control}
                name="materiaId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="materiaId" className="w-full">
                      <SelectValue placeholder="Sem matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fonte" htmlFor="fonte">
              <Input id="fonte" placeholder="Autor, canal, professor…" {...register('fonte')} />
            </FormField>
            <FormField label="Link" htmlFor="url">
              <Input id="url" placeholder="https://" {...register('url')} />
            </FormField>
          </div>

          <FormField label="Marcador">
            <div className="flex gap-2">
              {STUDY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={STUDY_COLOR_LABELS[c]}
                  onClick={() => setValue('cor', c)}
                  className={cn(
                    'size-6 rounded-md ring-offset-2 ring-offset-background transition-shadow',
                    cor === c && 'ring-2 ring-foreground',
                  )}
                  style={{ backgroundColor: studyColorVar(c) }}
                />
              ))}
            </div>
          </FormField>

          <FormField label={'Anotação · use **negrito**, "- " para lista, "> " para citação'} htmlFor="conteudo">
            <Textarea id="conteudo" rows={5} placeholder="O trecho, o raciocínio, o exemplo…" {...register('conteudo')} />
          </FormField>

          <FormField label="Pontos-chave · um por linha" htmlFor="chaves">
            <Textarea
              id="chaves"
              rows={3}
              placeholder={'Custo fixo não muda com o volume\nMargem de contribuição = preço − custo variável'}
              {...register('chaves')}
            />
          </FormField>

          <FormField label="Com minhas palavras · o teste de verdade" htmlFor="resumo">
            <Textarea
              id="resumo"
              rows={3}
              placeholder="Explique como se estivesse contando pra alguém que não viu o material."
              {...register('resumo')}
            />
          </FormField>

          <DialogFooter>
            <SubmitButton pending={isSubmitting}>{isEditing ? 'Salvar' : 'Criar anotação'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
