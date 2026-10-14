import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HotkeysProvider } from './context/HotkeysContext'
import { AchievementsProvider } from './context/AchievementsContext'
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
import AdminShopPage from './pages/AdminShopPage'

function ProtectedRoute() {
    const { token, loading } = useAuth()
    if (loading) return <div className="loading">Загрузка...</div>
    if (!token) return <Navigate to="/login" replace />
    return <Outlet />
}

function PublicRoute() {
    const { token, loading } = useAuth()
    if (loading) return <div className="loading">Загрузка...</div>
    if (token) return <Navigate to="/" replace />
    return <Outlet />
}

function HomeRedirect() {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div className="loading">Загрузка...</div>

    if (location.pathname !== '/') return null

    const ws = user?.workspace

    if (ws?.defaultBoardId) {
        if (ws?.launchProjectId) {
            return (
                <Navigate
                    to={`/boards/${ws.defaultBoardId}/projects/${ws.launchProjectId}`}
                    replace
                />
            )
        }
        return <Navigate to={`/boards/${ws.defaultBoardId}`} replace />
    }
    return <Navigate to="/calendar" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeApplier>
                    <AchievementsProvider>
                        <HotkeysProvider>
                            <Routes>
                                <Route element={<PublicRoute />}>
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                </Route>

                                <Route element={<ProtectedRoute />}>
                                    <Route element={<AppLayout />}>
                                        <Route path="/" element={<HomeRedirect />} />
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
                                        <Route path="/admin/shop" element={<AdminShopPage />} />
                                    </Route>
                                </Route>

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </HotkeysProvider>
                    </AchievementsProvider>
                </ThemeApplier>
            </AuthProvider>
        </BrowserRouter>
    )
}