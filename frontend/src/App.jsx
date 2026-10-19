import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from './context/AuthContext'
import {
    fetchMe,
    selectUser,
    selectAuthLoading,
    selectToken,
} from './store/slices/authSlice'
import { HotkeysProvider } from './context/HotkeysContext'
import { AchievementsProvider } from './context/AchievementsContext'
import ThemeApplier from './context/ThemeApplier'
import AppLayout from './components/layout/AppLayout'
import ErrorBoundary from './components/common/ErrorBoundary'

// Страницы грузятся лениво: в стартовый бандл попадает только каркас
// (роутер, стор, layout), а тяжёлые страницы (канбан, статистика с recharts,
// магазин, дашборд) подтягиваются при первом переходе. Раньше весь код
// приложения лежал в одном чанке ~1.3 МБ.
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const BoardsPage = lazy(() => import('./pages/BoardsPage'))
const BoardDetailPage = lazy(() => import('./pages/BoardDetailPage'))
const BoardSettingsPage = lazy(() => import('./pages/BoardSettingsPage'))
const ProjectKanbanPage = lazy(() => import('./pages/ProjectKanbanPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ProjectSearchPage = lazy(() => import('./pages/ProjectSearchPage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const AdminShopPage = lazy(() => import('./pages/AdminShopPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function PageFallback() {
    return (
        <div className="loading" role="status" aria-live="polite">
            Загрузка…
        </div>
    )
}

function ProtectedRoute() {
    const { token, loading } = useAuth()
    const dispatch = useDispatch()
    const user = useSelector(selectUser)

    // Единственная точка первичной загрузки профиля. Раньше fetchMe()
    // вызывался из useAuth() и стрелял при монтировании КАЖДОГО компонента,
    // использующего useAuth()/useT() (каждый столбец канбана, каждая карточка),
    // что порождало лавину параллельных /users/me и ERR_INSUFFICIENT_RESOURCES.
    useEffect(() => {
        if (!token || user) return
        dispatch(fetchMe())
    }, [token, user, dispatch])

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

export default function App() {
    return (
        <BrowserRouter>
            <ThemeApplier>
                <AchievementsProvider>
                    <HotkeysProvider>
                        <ErrorBoundary>
                            <Suspense fallback={<PageFallback />}>
                                <Routes>
                                    <Route element={<PublicRoute />}>
                                        <Route path="/login" element={<LoginPage />} />
                                        <Route path="/register" element={<RegisterPage />} />
                                    </Route>

                                    <Route element={<ProtectedRoute />}>
                                        <Route element={<AppLayout />}>
                                            <Route path="/" element={<DashboardPage />} />
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
                            </Suspense>
                        </ErrorBoundary>
                    </HotkeysProvider>
                </AchievementsProvider>
            </ThemeApplier>
        </BrowserRouter>
    )
}
