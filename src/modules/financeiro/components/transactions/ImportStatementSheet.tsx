import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useExpenseCategories, useIncomeCategories } from '@/modules/financeiro/hooks/useCategories'
import { useCategorias } from '@/modules/financeiro/hooks/useCategorias'
import {
  useRecentTransactions,
  useTransactionsInRange,
  useBulkCreateTransactions,
} from '@/modules/financeiro/hooks/useTransactions'
import { suggestCategory } from '@/modules/financeiro/lib/categorySuggest'
import { parseOfx, marcarProvaveisDuplicatas, type ParsedTransaction } from '@/modules/financeiro/lib/statementImport'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { getErrorMessage } from '@/shared/lib/errors'

interface ReviewRow extends ParsedTransaction {
  provavelDuplicata: boolean
  selected: boolean
  categoryId: string | undefined
  categoriaId: string | undefined
}

interface ImportStatementSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ImportStatementSheet({ open, onOpenChange }: ImportStatementSheetProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null)
  const [range, setRange] = useState<{ start?: string; end?: string }>({})
  const [rows, setRows] = useState<ReviewRow[]>([])

  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: categoriasDespesa = [] } = useCategorias('despesa')
  const { data: categoriasReceita = [] } = useCategorias('receita')
  const { data: recentTransactions = [] } = useRecentTransactions()
  const { data: existentes } = useTransactionsInRange(range.start, range.end)
  const bulkCreate = useBulkCreateTransactions()

  useEffect(() => {
    if (open) {
      setStep('upload')
      setParsed(null)
      setRange({})
      setRows([])
    }
  }, [open])

  // Once the parsed file and the existing-transactions window both land, build the
  // review rows (dedup flag + category suggestion) and move to the review step.
  useEffect(() => {
    if (!parsed || existentes === undefined) return
    const withDupes = marcarProvaveisDuplicatas(parsed, existentes)
    setRows(
      withDupes.map((r) => {
        const fixoField = r.tipo === 'saida' ? 'expense_category_id' : 'income_category_id'
        return {
          ...r,
          selected: !r.provavelDuplicata,
          categoryId: suggestCategory(r.descricao, recentTransactions, fixoField) ?? undefined,
          categoriaId: suggestCategory(r.descricao, recentTransactions, 'categoria_id') ?? undefined,
        }
      }),
    )
    setStep('review')
    setParsed(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, existentes])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const texto = await file.text()
    const result = parseOfx(texto)
    if (result.length === 0) {
      toast.error('Nenhuma transação encontrada nesse arquivo.')
      return
    }

    const datas = result.map((r) => r.data).sort()
    setRange({ start: datas[0], end: datas[datas.length - 1] })
    setParsed(result)
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const selectedCount = rows.filter((r) => r.selected).length

  async function handleImport() {
    const payload = rows
      .filter((r) => r.selected)
      .map((r) => ({
        data: r.data,
        descricao: r.descricao,
        valor_entrada: r.tipo === 'entrada' ? r.valor : 0,
        valor_saida: r.tipo === 'saida' ? r.valor : 0,
        expense_category_id: r.tipo === 'saida' ? r.categoryId ?? null : null,
        income_category_id: r.tipo === 'entrada' ? r.categoryId ?? null : null,
        categoria_id: r.categoriaId ?? null,
      }))

    try {
      await bulkCreate.mutateAsync(payload)
      toast.success(`${payload.length} lançamento${payload.length === 1 ? '' : 's'} importado${payload.length === 1 ? '' : 's'}`)
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao importar'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Importar extrato</SheetTitle>
        </SheetHeader>

        {step === 'upload' && (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Exporte o extrato do seu banco em formato OFX e envie aqui. Nada é lançado
              automaticamente — você revisa e escolhe o que entra antes de confirmar.
            </p>
            <input
              type="file"
              accept=".ofx"
              onChange={handleFileChange}
              className="rounded-md border p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === rows.length && rows.length > 0}
                  onCheckedChange={(checked) =>
                    setRows((prev) => prev.map((r) => ({ ...r, selected: !!checked })))
                  }
                />
                <span className="text-sm text-muted-foreground">Selecionar todos</span>
              </div>
              <span className="text-sm font-medium">
                {selectedCount} de {rows.length} selecionadas
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Categoria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => {
                  const isEntrada = r.tipo === 'entrada'
                  const fixoOptions = isEntrada ? incomeCategories : expenseCategories
                  const categoriaOptions = isEntrada ? categoriasReceita : categoriasDespesa
                  return (
                    <TableRow key={i} data-state={r.selected ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={r.selected}
                          onCheckedChange={(checked) => updateRow(i, { selected: !!checked })}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(r.data)}</TableCell>
                      <TableCell>
                        <p className="text-sm">{r.descricao}</p>
                        {r.provavelDuplicata && (
                          <Badge variant="secondary" className="mt-1">
                            Já lançado?
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={`whitespace-nowrap text-right text-sm font-medium ${isEntrada ? 'text-primary' : 'text-destructive'}`}
                      >
                        {isEntrada ? '+' : '-'}
                        {formatCurrency(r.valor)}
                      </TableCell>
                      <TableCell className="min-w-40">
                        <Select
                          value={r.categoriaId}
                          onValueChange={(v) => updateRow(i, { categoriaId: v })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sem categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriaOptions.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <span
                                  className="mr-1 inline-block size-2.5 rounded-full"
                                  style={{ backgroundColor: c.cor }}
                                />
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={r.categoryId}
                          onValueChange={(v) => updateRow(i, { categoryId: v })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder={isEntrada ? 'Receita fixa (opcional)' : 'Gasto fixo (opcional)'} />
                          </SelectTrigger>
                          <SelectContent>
                            {fixoOptions.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <Button onClick={handleImport} disabled={selectedCount === 0 || bulkCreate.isPending} className="mt-2">
              {bulkCreate.isPending
                ? 'Importando...'
                : `Importar ${selectedCount} lançamento${selectedCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
