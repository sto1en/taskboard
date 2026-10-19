import { useState, useEffect, useMemo } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { observer } from 'mobx-react-lite'
import { useUiStore } from '../../store/useUiStore'
import { useAuth } from '../../context/AuthContext'
import {
    selectActiveAvatar,
    selectActiveFrame,
} from '../../store/slices/shopSlice'
import {
    fetchPinned,
    selectPinnedBoards,
    selectPinnedProjectsByBoard,
} from '../../store/slices/sidebarSlice'
import {
    fetchStats,
    selectDoneToday,
} from '../../store/slices/statsSlice'
import { boardsApi, projectsApi } from '../../api/api'
import useT from '../../hooks/useT'
import TreeAvatar from './TreeAvatar'
import AvatarWithFrame from './AvatarWithFrame'
import ConfirmModal from '../common/ConfirmModal'

const MAX_PINS = 3

/**
 * Sidebar.
 *
 * Серверный стейт (пиннутые доски/проекты, магазин, дневная сводка) —
 * из Redux. Локальная UI-логика после D5 — из MobX:
 *   ui.sidebarCollapsed  — сворачивание панели (персист в localStorage внутри стора)
 *   ui.treeEnabledLocal  — видимость дерева (клавиша T), вместо события 'tree:toggle'
 * observer() нужен, чтобы панель перерисовывалась на этих observable-полях.
 */
export default observer(function Sidebar() {
    const { user, logout } = useAuth()
    const t = useT()
    const dispatch = useDispatch()
    const ui = useUiStore()

    // Магазин — серверный стейт из Redux (раньше: локальный useState + shop:refresh).
    // Sidebar нужны только производные — активные аватар и рамка; treeKind
    // считается отдельным селектором ниже.
    const activeAvatar = useSelector(selectActiveAvatar)
    const activeFrame = useSelector(selectActiveFrame)

    // Пиннутые доски/проекты — серверный стейт из Redux (раньше: локальный
    // load + событие 'sidebar:refresh' в 6 файлах).
    const boards = useSelector(selectPinnedBoards)
    const projectsByBoard = useSelector(selectPinnedProjectsByBoard)

    // Дерево: количество выполненных за день — серверный факт из Redux.
    const doneTasks = useSelector(selectDoneToday)

    const [boardsOpen, setBoardsOpen] = useState(true)
    const [showLogout, setShowLogout] = useState(false)

    // collapsed — локальная UI-логика из MobX (раньше: useState + localStorage).
    const collapsed = ui.sidebarCollapsed

    // treeKind: активный скин из магазина, иначе — сохранённый в профиле
    const treeKind = useSelector(
        (state) => state.shop.data?.treeSkins?.find(s => s.active)?.code,
    ) || user?.appearance?.treeKind || 'sakura'

    // treeEnabledLocal — локальная UI-логика из MobX (раньше: useState +
    // событие 'tree:toggle' из AppLayout).
    const treeEnabledByUser = user?.appearance?.treeEnabled !== false
    const treeVisible = treeEnabledByUser && ui.treeEnabledLocal
    const [treeOpen, setTreeOpen] = useState(() => {
        try { return localStorage.getItem('sidebar:treeOpen') !== '0' } catch { return true }
    })
    const toggleTree = () => {
        setTreeOpen(v => {
            const next = !v
            try { localStorage.setItem('sidebar:treeOpen', next ? '1' : '0') } catch { /* ignore */ }
            return next
        })
    }

    // Первичная загрузка пиннутых досок/проектов при монтировании панели.
    // Событие 'sidebar:refresh' больше не слушается: инвалидация идёт через
    // dispatch(fetchPinned()) из точек мутации.
    useEffect(() => {
        dispatch(fetchPinned())
    }, [dispatch])

    // Дерево: загружаем дневную сводку, пока оно видимо. Обновление после
    // мутаций — через dispatch(fetchStats()) (раньше: событие 'tree:refresh').
    useEffect(() => {
        if (!user || !treeVisible) return
        dispatch(fetchStats('day'))
    }, [user, treeVisible, dispatch])

    const displayName = user?.profile?.displayName || user?.username || 'User'

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
            dispatch(fetchPinned())
        } catch {}
    }

    const handleUnpinProject = async (project) => {
        try {
            await projectsApi.update(project.id, { isPinned: false })
            dispatch(fetchPinned())
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
                    {/* Клик по аватарке ведёт на главную: так «Главная» больше
                        не занимает первую строку меню, а доски остаются сверху. */}
                    <Link to="/" className="sidebar__user-avatar" title="Главная">
                        <AvatarWithFrame
                            avatar={activeAvatar}
                            frame={activeFrame}
                            displayName={displayName}
                            username={user?.username}
                            size={56}
                        />
                    </Link>

                    {!collapsed && (
                        <div className="sidebar__user-meta">
                            <div className="sidebar__name" title={displayName}>{displayName}</div>
                            <Link to="/profile" className="sidebar__profile-link">
                                смотреть профиль
                            </Link>
                        </div>
                    )}

                    <button
                        className="sidebar__icon-btn"
                        onClick={ui.toggleCollapsed}
                        title={collapsed ? 'Развернуть' : 'Свернуть'}
                    >
                        {collapsed ? '»' : '«'}
                    </button>
                </div>

                <nav className="sidebar__nav">
                    <div className="sidebar__group-row">
                        <NavLink to="/boards" className="sidebar__group-link" title={t.boards}>
                            <span className="sidebar__group-icon">📋</span>
                            {!collapsed && <span>{t.boards}</span>}
                        </NavLink>
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

                    <NavLink
                        to="/calendar"
                        end
                        className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
                        title={t.calendar}
                    >
                        <span>📅</span>
                        {!collapsed && <span>{t.calendar}</span>}
                    </NavLink>

                    <NavLink
                        to="/stats"
                        end
                        className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
                        title={t.stats}
                    >
                        <span>📊</span>
                        {!collapsed && <span>{t.stats}</span>}
                    </NavLink>
                </nav>

                <div className="sidebar__bottom">
                    {treeVisible && !collapsed && (
                        <div className="sidebar__tree">
                            <button
                                type="button"
                                className="sidebar__tree-head"
                                onClick={toggleTree}
                                aria-expanded={treeOpen}
                                title="Дерево растёт, когда вы выполняете задачи. Клик по дереву — листья."
                            >
                                <span className="sidebar__tree-title">🌳 Дерево</span>
                                <span className="sidebar__tree-caret">{treeOpen ? '▾' : '▸'}</span>
                            </button>
                            {treeOpen && (
                                <>
                                    <TreeAvatar done={doneTasks} kind={treeKind} maxHeight={400} />
                                    <div className="sidebar__tree-hint">
                                        Растёт от выполненных задач. Клик — листья.
                                    </div>
                                </>
                            )}
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

                    {user?.isAdmin && (
                        <Link to="/admin/shop" className="sidebar__link" title="Админка магазина">
                            <span>🛠</span>
                            {!collapsed && <span>Админка</span>}
                        </Link>
                    )}

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
})