import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleCardPage from './pages/VehicleCardPage'
import AddVehiclePage from './pages/AddVehiclePage'
import AddMaintenancePage from './pages/AddMaintenancePage'
import TasksPage from './pages/TasksPage'
import CompaniesPage from './pages/CompaniesPage'
import ReportsPage from './pages/ReportsPage'
import AIChatPage from './pages/AIChatPage'
import OCRPage from './pages/OCRPage'
import InsurancePage from './pages/InsurancePage'
import CascoPage from './pages/CascoPage'
import DamagesPage from './pages/DamagesPage'
import RepairsPage from './pages/RepairsPage'
import TiresPage from './pages/TiresPage'
import DocumentsPage from './pages/DocumentsPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleCardPage />} />
          <Route path="vehicles/new" element={<AddVehiclePage />} />
          <Route path="vehicles/:id/maintenance" element={<AddMaintenancePage />} />
          <Route path="vehicles/:id/documents" element={<DocumentsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="insurance" element={<InsurancePage />} />
          <Route path="casco" element={<CascoPage />} />
          <Route path="damages" element={<DamagesPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="tires" element={<TiresPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ai" element={<AIChatPage />} />
          <Route path="ocr" element={<OCRPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
