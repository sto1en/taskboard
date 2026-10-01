import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api, { statsApi } from '../../api/api'
import useT from '../../hooks/useT'
import TreeAvatar from './TreeAvatar'
import ConfirmModal from '../common/ConfirmModal'

const MAX_PINS = 3

export default function Sidebar() {
    const { user, logout } = useAuth()
    const t = useT()
    const [boards, setBoards] = useState([])
    const [projectsByBoard, setProjectsByBoard] = useState({})
    const [boardsOpen, setBoardsOpen] = useState(true)
    const [doneTasks, setDoneTasks] = useState(0)
    const [showLogout, setShowLogout] = useState(false)
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true'
    })

    const treeEnabledByUser = user?.appearance?.treeEnabled !== false
    const treeKind = user?.appearance?.treeKind || 'sakura'

    // Локальный toggle (горячая клавиша T)
    const [treeEnabledLocal, setTreeEnabledLocal] = useState(() => {
        const v = localStorage.getItem('tree_enabled')
        return v === null ? true : v === 'true'
    })

    // Панель пользователя (горячая клавиша P)
    const [userHidden, setUserHidden] = useState(() => {
        return localStorage.getItem('sidebar_user_hidden') === 'true'
    })

    const treeVisible = treeEnabledByUser && treeEnabledLocal

    // Слушаем события от AppLayout
    useEffect(() => {
        const onTreeToggle = (e) => setTreeEnabledLocal(!!e.detail)
        const onUserToggle = (e) => setUserHidden(!!e.detail)
        window.addEventListener('tree:toggle', onTreeToggle)
        window.addEventListener('sidebar:toggle-user', onUserToggle)
        return () => {
            window.removeEventListener('tree:toggle', onTreeToggle)
            window.removeEventListener('sidebar:toggle-user', onUserToggle)
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data: allBoards } = await api.get('/boards')
                const pinnedBoards = allBoards.filter(b => b.isPinned)
                if (cancelled) return
                const projectsArrays = await Promise.all(
                    pinnedBoards.map(b =>
                        api.get(`/boards/${b.id}/projects`)
                            .then(({ data }) => [b.id, data.filter(p => p.isPinned)])
                            .catch(() => [b.id, []])
                    )
                )
                if (cancelled) return
                setBoards(pinnedBoards)
                setProjectsByBoard(Object.fromEntries(projectsArrays))
            } catch {
                if (!cancelled) {
                    setBoards([])
                    setProjectsByBoard({})
                }
            }
        }
        load()
        const onRefresh = () => load()
        window.addEventListener('sidebar:refresh', onRefresh)
        return () => {
            cancelled = true
            window.removeEventListener('sidebar:refresh', onRefresh)
        }
    }, [])

    useEffect(() => {
        if (!user) return
        if (!treeVisible) return

        const load = () => {
            statsApi.get('day')
                .then(({ data }) => setDoneTasks(data.done || 0))
                .catch(() => {})
        }
        load()
        window.addEventListener('tree:refresh', load)
        return () => window.removeEventListener('tree:refresh', load)
    }, [user, treeVisible])

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(collapsed))
    }, [collapsed])

    const displayName = user?.profile?.displayName || user?.username || 'User'
    const initial = displayName.charAt(0).toUpperCase()
    const avatarUrl = user?.profile?.avatarUrl
    const hasPinned = boards.length > 0

    let pinCount = 0
    const visibleBoards = []
    const visibleProjects = {}
    for (const b of boards) {
        if (pinCount >= MAX_PINS) break
        const projs = projectsByBoard[b.id] || []
        if (projs.length > 0) {
            const remaining = MAX_PINS - pinCount
            const slice = projs.slice(0, remaining)
            visibleProjects[b.id] = slice
            pinCount += slice.length
            visibleBoards.push(b)
        } else {
            visibleProjects[b.id] = []
            pinCount += 1
            visibleBoards.push(b)
        }
    }

    const handleLogoutConfirm = () => {
        setShowLogout(false)
        logout()
    }

    return (
        <>
            <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
                {!userHidden && (
                    <div className="sidebar__user">
                        <Link to="/profile" className="sidebar__avatar" title={t.tabProfile}>
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
                                title={t.logout}
                                onClick={() => setShowLogout(true)}
                            >⎋</button>
                        )}

                        <button
                            className="sidebar__collapse"
                            onClick={() => setCollapsed(v => !v)}
                            title={collapsed ? 'Expand' : 'Collapse'}
                        >
                            {collapsed ? '»' : '«'}
                        </button>
                    </div>
                )}

                <nav className="sidebar__nav">
                    <div className="sidebar__group-row">
                        <Link to="/boards" className="sidebar__group-link" title={t.boards}>
                            <span className="sidebar__group-icon">📋</span>
                            {!collapsed && <span>{t.boards}</span>}
                        </Link>

                        {!collapsed && hasPinned && (
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

                    {!collapsed && boardsOpen && hasPinned && (
                        <div className="sidebar__subnav">
                            {visibleBoards.map(b => (
                                <div key={b.id} className="sidebar__pinned-board">
                                    <NavLink
                                        to={`/boards/${b.id}`}
                                        className={({ isActive }) =>
                                            `sidebar__sublink ${isActive ? 'active' : ''}`
                                        }
                                    >
                                        {b.title}
                                    </NavLink>

                                    {visibleProjects[b.id]?.length > 0 && (
                                        <div className="sidebar__pinned-projects">
                                            {visibleProjects[b.id].map(p => (
                                                <NavLink
                                                    key={p.id}
                                                    to={`/boards/${b.id}/projects/${p.id}`}
                                                    className={({ isActive }) =>
                                                        `sidebar__sublink sidebar__sublink--project ${isActive ? 'active' : ''}`
                                                    }
                                                >
                                                    {p.title}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!collapsed && boardsOpen && !hasPinned && (
                        <div className="sidebar__hint">{t.noPinned}</div>
                    )}

                    <div className="sidebar__divider" />

                    <NavLink to="/calendar" className="sidebar__link" title={t.calendar}>
                        <span>📅</span>
                        {!collapsed && <span>{t.calendar}</span>}
                    </NavLink>

                    <NavLink to="/stats" className="sidebar__link" title={t.stats}>
                        <span>📊</span>
                        {!collapsed && <span>{t.stats}</span>}
                    </NavLink>
                </nav>

                <div className="sidebar__bottom">
                    {treeVisible && !collapsed && (
                        <div className="sidebar__tree">
                            <TreeAvatar done={doneTasks} kind={treeKind} maxHeight={400} />
                        </div>
                    )}

                    <Link to="/help" className="sidebar__link" title={t.help}>
                        <span>❓</span>
                        {!collapsed && <span>{t.help}</span>}
                    </Link>

                    <Link to="/settings" className="sidebar__link" title={t.settings}>
                        <span>⚙</span>
                        {!collapsed && <span>{t.settings}</span>}
                    </Link>
                </div>
            </aside>

            <ConfirmModal
                open={showLogout}
                title={t.confirmLogoutTitle}
                text={t.confirmLogoutText}
                confirmLabel={t.yesLogout}
                cancelLabel={t.cancel}
                danger
                onConfirm={handleLogoutConfirm}
                onClose={() => setShowLogout(false)}
            />
        </>
    )
}