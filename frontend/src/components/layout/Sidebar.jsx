import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api, { statsApi } from '../../api/api'
import TreeAvatar from './TreeAvatar'

export default function Sidebar() {
    const { user, logout } = useAuth()
    const [boards, setBoards] = useState([])
    const [boardsOpen, setBoardsOpen] = useState(true)
    const [doneTasks, setDoneTasks] = useState(0)
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true'
    })

    useEffect(() => {
        api.get('/boards').then(({ data }) => setBoards(data))
    }, [])

    // Дерево роста: считаем выполненные задачи ЗА СЕГОДНЯ
    useEffect(() => {
        if (!user) return

        const load = () => {
            statsApi.get('day')
                .then(({ data }) => setDoneTasks(data.done || 0))
                .catch(() => {})
        }

        load()
        window.addEventListener('tree:refresh', load)
        return () => window.removeEventListener('tree:refresh', load)
    }, [user])

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(collapsed))
    }, [collapsed])

    const displayName = user?.profile?.displayName || user?.username || 'User'
    const initial = displayName.charAt(0).toUpperCase()
    const avatarUrl = user?.profile?.avatarUrl

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__user">
                <Link to="/profile" className="sidebar__avatar" title="Профиль">
                    {avatarUrl
                        ? <img src={avatarUrl} alt={displayName} />
                        : initial}
                </Link>

                {!collapsed && (
                    <div className="sidebar__name">{displayName}</div>
                )}

                {!collapsed && (
                    <button
                        className="sidebar__logout"
                        title="Выйти"
                        onClick={logout}
                    >
                        ⎋
                    </button>
                )}

                <button
                    className="sidebar__collapse"
                    onClick={() => setCollapsed(v => !v)}
                    title={collapsed ? 'Развернуть' : 'Свернуть'}
                >
                    {collapsed ? '»' : '«'}
                </button>
            </div>

            <nav className="sidebar__nav">
                <div className="sidebar__group-row">
                    <Link to="/boards" className="sidebar__group-link" title="Boards">
                        <span className="sidebar__group-icon">📋</span>
                        {!collapsed && <span>Boards</span>}
                    </Link>

                    {!collapsed && (
                        <button
                            className="sidebar__group-toggle"
                            onClick={() => setBoardsOpen(v => !v)}
                        >
                            <span className={`sidebar__caret ${boardsOpen ? 'sidebar__caret--open' : ''}`}>
                                ▸
                            </span>
                        </button>
                    )}
                </div>

                {!collapsed && boardsOpen && (
                    <div className="sidebar__subnav">
                        {boards.map(b => (
                            <NavLink
                                key={b.id}
                                to={`/boards/${b.id}`}
                                className={({ isActive }) =>
                                    `sidebar__sublink ${isActive ? 'active' : ''}`
                                }
                            >
                                {b.title}
                            </NavLink>
                        ))}
                    </div>
                )}

                <div className="sidebar__divider" />

                <NavLink to="/calendar" className="sidebar__link" title="Calendar">
                    <span>📅</span>
                    {!collapsed && <span>Calendar</span>}
                </NavLink>

                <NavLink to="/stats" className="sidebar__link" title="Stats">
                    <span>📊</span>
                    {!collapsed && <span>Stats</span>}
                </NavLink>
            </nav>

            <div className="sidebar__bottom">
                {/* Дерево роста — над Help */}
                {!collapsed && (
                    <div className="sidebar__tree">
                        <TreeAvatar done={doneTasks} maxHeight={400} />
                        <div className="sidebar__tree-label">
                            {doneTasks} {pluralDone(doneTasks)} сегодня
                        </div>
                    </div>
                )}

                <Link to="/help" className="sidebar__link" title="Help">
                    <span>❓</span>
                    {!collapsed && <span>Help</span>}
                </Link>

                <Link to="/settings" className="sidebar__link" title="Settings">
                    <span>⚙</span>
                    {!collapsed && <span>Settings</span>}
                </Link>
            </div>
        </aside>
    )
}

function pluralDone(n) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return 'задача выполнена'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи выполнено'
    return 'задач выполнено'
}