import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/shared/components/ui/sonner'
import { queryClient } from '@/shared/lib/queryClient'
import { AuthProvider } from '@/shared/context/AuthProvider'
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute'
import { HubShell } from '@/shared/components/layout/HubShell'
import LoginPage from '@/app/pages/LoginPage'
import HubHomePage from '@/app/pages/HubHomePage'

import { FinanceiroShell } from '@/modules/financeiro/components/layout/FinanceiroShell'
import DashboardPage from '@/modules/financeiro/pages/DashboardPage'
import TransactionsPage from '@/modules/financeiro/pages/TransactionsPage'
import BudgetPage from '@/modules/financeiro/pages/BudgetPage'
import FixedExpensesPage from '@/modules/financeiro/pages/FixedExpensesPage'
import CategoriesPage from '@/modules/financeiro/pages/CategoriesPage'
import EmergencyFundPage from '@/modules/financeiro/pages/EmergencyFundPage'
import GoalsPage from '@/modules/financeiro/pages/GoalsPage'
import ForecastPage from '@/modules/financeiro/pages/ForecastPage'
import HowToUsePage from '@/modules/financeiro/pages/HowToUsePage'

import { HabitosShell } from '@/modules/habitos/components/layout/HabitosShell'
import TodayPage from '@/modules/habitos/pages/TodayPage'
import HabitsManagePage from '@/modules/habitos/pages/HabitsManagePage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<HubShell />}>
                <Route path="/" element={<HubHomePage />} />

                <Route path="/financeiro" element={<FinanceiroShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="budget" element={<BudgetPage />} />
                  <Route path="goals" element={<GoalsPage />} />
                  <Route path="forecast" element={<ForecastPage />} />
                  <Route path="emergency-fund" element={<EmergencyFundPage />} />
                  <Route path="gastos-fixos" element={<FixedExpensesPage />} />
                  <Route path="categorias" element={<CategoriesPage />} />
                  <Route path="como-usar" element={<HowToUsePage />} />
                </Route>

                <Route path="/habitos" element={<HabitosShell />}>
                  <Route index element={<TodayPage />} />
                  <Route path="habits" element={<HabitsManagePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}

export default App
