import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BoardsPage from './pages/BoardsPage'
import BoardDetailPage from './pages/BoardDetailPage'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import InProgressPage from './pages/InProgressPage'
import DonePage from './pages/DonePage'
import ArchivedPage from './pages/ArchivedPage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<AppLayout />}>
                    <Route path="/boards" element={<BoardsPage />} />
                    <Route path="/boards/:id" element={<BoardDetailPage />} />
                    <Route path="/in-progress" element={<InProgressPage />} />
                    <Route path="/done" element={<DonePage />} />
                    <Route path="/archived" element={<ArchivedPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}