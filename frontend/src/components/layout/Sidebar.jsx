import { useState, useEffect, useMemo } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api, { statsApi, projectsApi, boardsApi, shopApi } from '../../api/api'
import useT from '../../hooks/useT'
import TreeAvatar from './TreeAvatar'
import AvatarWithFrame from './AvatarWithFrame'
import ConfirmModal from '../common/ConfirmModal'

const MAX_PINS = 3

export default function Sidebar() {
    const { user, logout } = useAuth()
    const t = useT()

    const [boards, setBoards] = useState([])
    const [projectsByBoard, setProjectsByBoard] = useState({})
    const [boardsOpen, setBoardsOpen] = useState(true)
    const [doneTasks, setDoneTasks] = useState(0)
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true'
    })
    const [showLogout, setShowLogout] = useState(false)

    const [shop, setShop] = useState(null)

    const treeEnabledByUser = user?.appearance?.treeEnabled !== false
    const treeKind = shop?.treeSkins?.find(s => s.active)?.code
        || user?.appearance?.treeKind
        || 'sakura'

    const [treeEnabledLocal, setTreeEnabledLocal] = useState(() => {
        const v = localStorage.getItem('tree_enabled')
        return v === null ? true : v === 'true'
    })

    const treeVisible = treeEnabledByUser && treeEnabledLocal

    useEffect(() => {
        const onTreeToggle = (e) => setTreeEnabledLocal(!!e.detail)
        window.addEventListener('tree:toggle', onTreeToggle)
        return () => window.removeEventListener('tree:toggle', onTreeToggle)
    }, [])

    const loadShop = () => {
        shopApi.get().then(({ data }) => setShop(data)).catch(() => setShop(null))
    }

    useEffect(() => {
        loadShop()
        const onRefresh = () => loadShop()
        window.addEventListener('shop:refresh', onRefresh)
        window.addEventListener('user:refresh', onRefresh)
        return () => {
            window.removeEventListener('shop:refresh', onRefresh)
            window.removeEventListener('user:refresh', onRefresh)
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data: allBoards } = await api.get('/boards')
                const projectsArrays = await Promise.all(
                    allBoards.map(b =>
                        api.get(`/boards/${b.id}/projects`)
                            .then(({ data }) => [b.id, data])
                            .catch(() => [b.id, []])
                    )
                )
                if (cancelled) return
                const mapProjects = Object.fromEntries(projectsArrays)
                const visibleBoards = allBoards
                    .filter(b => {
                        const projs = mapProjects[b.id] || []
                        return b.isPinned || projs.some(p => p.isPinned)
                    })
                    .sort((a, b) => {
                        const pa = a.position ?? 0, pb = b.position ?? 0
                        if (pa !== pb) return pa - pb
                        return (a.id || 0) - (b.id || 0)
                    })
                const visibleProjects = {}
                for (const b of visibleBoards) {
                    visibleProjects[b.id] = (mapProjects[b.id] || [])
                        .filter(p => p.isPinned)
                        .sort((a, b2) => (a.position ?? 0) - (b2.position ?? 0))
                }
                setBoards(visibleBoards)
                setProjectsByBoard(visibleProjects)
            } catch {
                if (!cancelled) { setBoards([]); setProjectsByBoard({}) }
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
        if (!user || !treeVisible) return
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

    const activeAvatar = shop?.avatars?.find(a => a.active) || null
    const activeFrame = shop?.frames?.find(f => f.active) || null

    const hasPinned = boards.length > 0

    const { visibleBoards, visibleProjects } = useMemo(() => {
        let pinCount = 0
        const vBoards = []
        const vProjects = {}
        for (const b of boards) {
            if (pinCount >= MAX_PINS) break
            const projs = projectsByBoard[b.id] || []
            if (projs.length > 0) {
                const slice = projs.slice(0, MAX_PINS - pinCount)
                vProjects[b.id] = slice
                pinCount += slice.length
                vBoards.push(b)
            } else {
                vProjects[b.id] = []
                pinCount += 1
                vBoards.push(b)
            }
        }
        return { visibleBoards: vBoards, visibleProjects: vProjects }
    }, [boards, projectsByBoard])

    const handleUnpinBoard = async (board) => {
        try {
            await boardsApi.update(board.id, { isPinned: false })
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch {}
    }

    const handleUnpinProject = async (project) => {
        try {
            await projectsApi.update(project.id, { isPinned: false })
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch {}
    }

    const handleLogoutConfirm = () => {
        setShowLogout(false)
        logout()
    }

    return (
        <>
            <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
                <div className="sidebar__user">
                    {/* Аватар */}
                    <Link to="/profile" className="sidebar__user-avatar" title="Настройки профиля">
                        <AvatarWithFrame
                            avatar={activeAvatar}
                            frame={activeFrame}
                            displayName={displayName}
                            username={user?.username}
                            size={56}
                        />
                    </Link>

                    {/* Ник — крупнее */}
                    {!collapsed && (
                        <div className="sidebar__name" title={displayName}>{displayName}</div>
                    )}

                    {/* Свернуть */}
                    <button
                        className="sidebar__icon-btn"
                        onClick={() => setCollapsed(v => !v)}
                        title={collapsed ? 'Развернуть' : 'Свернуть'}
                    >
                        {collapsed ? '»' : '«'}
                    </button>
                </div>

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
                                title={boardsOpen ? 'Свернуть' : 'Развернуть'}
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
                                    <div className="sidebar__sublink-row">
                                        <NavLink
                                            to={`/boards/${b.id}`}
                                            className={({ isActive }) =>
                                                `sidebar__sublink ${isActive ? 'active' : ''}`
                                            }
                                        >{b.title}</NavLink>
                                        {b.isPinned && (
                                            <button
                                                type="button"
                                                className="sidebar__unpin"
                                                onClick={() => handleUnpinBoard(b)}
                                                title="Открепить доску"
                                            >📌</button>
                                        )}
                                    </div>
                                    {(visibleProjects[b.id] || []).length > 0 && (
                                        <div className="sidebar__pinned-projects">
                                            {(visibleProjects[b.id] || []).map(p => (
                                                <div key={p.id} className="sidebar__sublink-row">
                                                    <NavLink
                                                        to={`/boards/${b.id}/projects/${p.id}`}
                                                        className={({ isActive }) =>
                                                            `sidebar__sublink sidebar__sublink--project ${isActive ? 'active' : ''}`
                                                        }
                                                    >{p.title}</NavLink>
                                                    {p.isPinned && (
                                                        <button
                                                            type="button"
                                                            className="sidebar__unpin"
                                                            onClick={() => handleUnpinProject(p)}
                                                            title="Открепить проект"
                                                        >📌</button>
                                                    )}
                                                </div>
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

                    {/* Выйти — в самом низу, красная */}
                    <button
                        className="sidebar__logout"
                        onClick={() => setShowLogout(true)}
                        title={t.logout || 'Выйти из аккаунта'}
                    >
                        <span className="sidebar__logout-icon">⎋</span>
                        {!collapsed && <span className="sidebar__logout-text">Выйти</span>}
                    </button>
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