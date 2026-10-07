import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HotkeysProvider } from './context/HotkeysContext'
import ThemeApplier from './context/ThemeApplier'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BoardsPage from './pages/BoardsPage'
import BoardDetailPage from './pages/BoardDetailPage'
import BoardSettingsPage from './pages/BoardSettingsPage'
import ProjectKanbanPage from './pages/ProjectKanbanPage'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import ProfilePage from './pages/ProfilePage'
import HelpPage from './pages/HelpPage'
import SettingsPage from './pages/SettingsPage'
import SearchPage from './pages/SearchPage'
import ProjectSearchPage from './pages/ProjectSearchPage'
import ShopPage from './pages/ShopPage'

function ProtectedRoute({ children }) {
    const { token, loading } = useAuth()
    if (loading) return <div className="loading">Загрузка...</div>
    if (!token) return <Navigate to="/login" replace />
    return children
}

function PublicRoute({ children }) {
    const { token, loading } = useAuth()
    if (loading) return <div className="loading">Загрузка...</div>
    if (token) return <Navigate to="/calendar" replace />
    return children
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeApplier>
                    <HotkeysProvider>
                        <Routes>
                            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                                <Route path="/calendar" element={<CalendarPage />} />
                                <Route path="/boards" element={<BoardsPage />} />
                                <Route path="/boards/:id" element={<BoardDetailPage />} />
                                <Route path="/boards/:boardId/settings" element={<BoardSettingsPage />} />
                                <Route path="/boards/:boardId/projects/:projectId" element={<ProjectKanbanPage />} />
                                <Route path="/stats" element={<StatsPage />} />
                                <Route path="/shop" element={<ShopPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/help" element={<HelpPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/boards/:boardId/projects/:projectId/search" element={<ProjectSearchPage />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/calendar" replace />} />
                        </Routes>
                    </HotkeysProvider>
                </ThemeApplier>
            </AuthProvider>
        </BrowserRouter>
    )
}