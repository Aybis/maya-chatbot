import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import ChatPage from './pages/ChatPage'
import ProjectsPage from './pages/ProjectsPage'
import MemoryPage from './pages/MemoryPage'
import SkillsPage from './pages/SkillsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import ProvidersPage from './pages/ProvidersPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing site */}
        <Route path="/" element={<Landing />} />

        {/* Auth routes - no layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected app - with layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/app" element={<ChatPage />} />
          <Route path="/app/projects" element={<ProjectsPage />} />
          <Route path="/app/memory" element={<MemoryPage />} />
          <Route path="/app/skills" element={<SkillsPage />} />
          <Route path="/app/analytics" element={<AnalyticsPage />} />
          <Route path="/app/team" element={<TeamPage />} />
          <Route path="/app/providers" element={<ProvidersPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}