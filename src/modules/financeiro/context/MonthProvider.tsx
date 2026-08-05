import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { shiftMonth } from '@/modules/financeiro/lib/monthUtils'

interface MonthContextValue {
  selectedMonth: Date
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined)

export function MonthProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date())

  const value = useMemo<MonthContextValue>(
    () => ({
      selectedMonth,
      goToPreviousMonth: () => setSelectedMonth((d) => shiftMonth(d, -1)),
      goToNextMonth: () => setSelectedMonth((d) => shiftMonth(d, 1)),
      goToCurrentMonth: () => setSelectedMonth(new Date()),
    }),
    [selectedMonth],
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used within MonthProvider')
  return ctx
}
