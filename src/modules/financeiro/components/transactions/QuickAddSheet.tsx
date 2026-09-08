import { Controller } from 'react-hook-form'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Input } from '@/shared/components/ui/input'
import { DatePicker } from '@/shared/components/common/DatePicker'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useQuickAddForm } from '@/modules/financeiro/hooks/useQuickAddForm'
import { FormField } from '@/shared/components/common/FormField'
import { SubmitButton } from '@/shared/components/common/SubmitButton'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction?: Tables<'transactions'>
}

export function QuickAddSheet({ open, onOpenChange, transaction }: QuickAddSheetProps) {
  // Sheet de baixo no celular (alcance de polegar), dialog compacto e
  // centralizado no PC — o formulário inteiro esticado full-width numa tela
  // grande não é ergonômico nem parece um popup de verdade.
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const {
    register,
    handleSubmit,
    control,
    errors,
    tipo,
    fixoOptions,
    categoriaOptions,
    cartaoOptions,
    categoriaSuggestion,
    isEditing,
    isPending,
    handleTipoChange,
    onSubmit,
  } = useQuickAddForm({ open, onOpenChange, transaction })

  const title = isEditing ? 'Editar lançamento' : 'Novo lançamento'

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('flex flex-col gap-4', !isDesktop && 'px-4 pb-6')}>
      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <ToggleGroup
            type="single"
            value={field.value}
            onValueChange={(v) => v && handleTipoChange(v)}
            className="w-full"
          >
            <ToggleGroupItem value="saida" className="flex-1">
              Saída
            </ToggleGroupItem>
            <ToggleGroupItem value="entrada" className="flex-1">
              Entrada
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      />

      <FormField label="Valor (R$)" htmlFor="valor" error={errors.valor?.message}>
        <Input id="valor" type="number" inputMode="decimal" step="0.01" autoFocus {...register('valor')} />
      </FormField>

      <FormField label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
        <Input id="descricao" placeholder="Ex: Mercado, Uber, Salário..." {...register('descricao')} />
      </FormField>

      <FormField label="Categoria" htmlFor="categoriaId" error={errors.categoriaId?.message}>
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoriaId" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="mr-1 inline-block size-2.5 rounded-full" style={{ backgroundColor: c.cor }} />
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {categoriaSuggestion && !isEditing && (
          <p className="text-xs text-muted-foreground">Categoria sugerida com base no histórico</p>
        )}
      </FormField>

      <FormField label="Cartão" htmlFor="cartaoId" error={errors.cartaoId?.message}>
        <Controller
          control={control}
          name="cartaoId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="cartaoId" className="w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {cartaoOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="mr-1 inline-block size-2.5 rounded-full" style={{ backgroundColor: c.cor }} />
                    {c.nome}
                    <span className="text-muted-foreground"> · {c.tipo === 'credito' ? 'Crédito' : 'Débito'}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label={tipo === 'saida' ? 'Gasto Fixo (opcional)' : 'Receita Fixa (opcional)'} htmlFor="categoryId">
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder={tipo === 'saida' ? 'Nenhum' : 'Nenhuma'} />
              </SelectTrigger>
              <SelectContent>
                {fixoOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Data" htmlFor="data">
        <Controller
          control={control}
          name="data"
          render={({ field }) => <DatePicker id="data" value={field.value} onChange={field.onChange} />}
        />
      </FormField>

      <SubmitButton pending={isPending} className="mt-2">
        Salvar
      </SubmitButton>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {form}
      </SheetContent>
    </Sheet>
  )
}
