import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/shared/components/ui/sonner'
import { queryClient } from '@/shared/lib/queryClient'
import { AuthProvider } from '@/shared/context/AuthProvider'
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute'
import { HubShell } from '@/shared/components/layout/HubShell'
import LoginPage from '@/app/pages/LoginPage'
import PrivacyPolicyPage from '@/app/pages/PrivacyPolicyPage'
import HubHomePage from '@/app/pages/HubHomePage'

import { FinanceiroShell } from '@/modules/financeiro/components/layout/FinanceiroShell'
import DashboardPage from '@/modules/financeiro/pages/DashboardPage'
import TransactionsPage from '@/modules/financeiro/pages/TransactionsPage'
import BudgetPage from '@/modules/financeiro/pages/BudgetPage'
import FixedExpensesPage from '@/modules/financeiro/pages/FixedExpensesPage'
import CategoriesPage from '@/modules/financeiro/pages/CategoriesPage'
import CartoesPage from '@/modules/financeiro/pages/CartoesPage'
import EmergencyFundPage from '@/modules/financeiro/pages/EmergencyFundPage'
import GoalsPage from '@/modules/financeiro/pages/GoalsPage'
import ForecastPage from '@/modules/financeiro/pages/ForecastPage'
import HowToUsePage from '@/modules/financeiro/pages/HowToUsePage'

import { HabitosShell } from '@/modules/habitos/components/layout/HabitosShell'
import HabitosPage from '@/modules/habitos/pages/HabitosPage'

import { EstudosShell } from '@/modules/estudos/components/layout/EstudosShell'
import HojePage from '@/modules/estudos/pages/HojePage'
import NotasPage from '@/modules/estudos/pages/NotasPage'
import ChatListPage from '@/modules/estudos/pages/ChatListPage'
import ChatThreadPage from '@/modules/estudos/pages/ChatThreadPage'
import MapasListPage from '@/modules/estudos/pages/MapasListPage'
import MapaViewPage from '@/modules/estudos/pages/MapaViewPage'
import ConsultasPage from '@/modules/estudos/pages/ConsultasPage'
import ConsultaViewPage from '@/modules/estudos/pages/ConsultaViewPage'

import { ProducaoShell } from '@/modules/producao/components/layout/ProducaoShell'
import CalendarioPage from '@/modules/producao/pages/CalendarioPage'
import RoteirosPage from '@/modules/producao/pages/RoteirosPage'
import RoteiroEditorPage from '@/modules/producao/pages/RoteiroEditorPage'
import ReferenciasPage from '@/modules/producao/pages/ReferenciasPage'
import IdeiasPage from '@/modules/producao/pages/IdeiasPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacidade" element={<PrivacyPolicyPage />} />
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
                  <Route path="cartoes" element={<CartoesPage />} />
                  <Route path="como-usar" element={<HowToUsePage />} />
                </Route>

                <Route path="/habitos" element={<HabitosShell />}>
                  <Route index element={<HabitosPage />} />
                </Route>

                <Route path="/estudos" element={<EstudosShell />}>
                  <Route index element={<HojePage />} />
                  <Route path="notas" element={<NotasPage />} />
                  <Route path="chat" element={<ChatListPage />} />
                  <Route path="chat/nova" element={<ChatThreadPage />} />
                  <Route path="chat/:conversaId" element={<ChatThreadPage />} />
                  <Route path="mapas" element={<MapasListPage />} />
                  <Route path="mapas/:mapaId" element={<MapaViewPage />} />
                  <Route path="consultas" element={<ConsultasPage />} />
                  <Route path="consultas/:consultaId" element={<ConsultaViewPage />} />
                </Route>

                <Route path="/producao" element={<ProducaoShell />}>
                  <Route index element={<CalendarioPage />} />
                  <Route path="roteiros" element={<RoteirosPage />} />
                  <Route path="roteiros/:roteiroId" element={<RoteiroEditorPage />} />
                  <Route path="referencias" element={<ReferenciasPage />} />
                  <Route path="ideias" element={<IdeiasPage />} />
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
