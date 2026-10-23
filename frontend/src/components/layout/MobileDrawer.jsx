import { useState, useEffect, useMemo, useRef } from 'react'
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
    fetchGroupProjects,
    selectPinnedBoards,
    selectPinnedProjectsByBoard,
    selectGroupProjects,
} from '../../store/slices/sidebarSlice'
import {
    fetchStats,
    fetchDailyGoal,
    claimDailyGoal,
    selectDoneToday,
    selectDailyGoal,
    selectClaimingDailyGoal,
} from '../../store/slices/statsSlice'
import { boardsApi, projectsApi } from '../../api/api'
import useT from '../../hooks/useT'
import { useIsMobile } from '../../hooks/useMediaQuery'
import TreeAvatar from './TreeAvatar'
import AvatarWithFrame from './AvatarWithFrame'
import ConfirmModal from '../common/ConfirmModal'

const MAX_PINS = 3

const TIER_LABELS = {
    none: 'Спокойный день',
    good: 'Хороший день',
    excellent: 'Отличный день',
    legendary: 'Легендарный день',
}

const pluralTasks = (n) => (
    n % 10 === 1 && n % 100 !== 11
        ? 'задача'
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
            ? 'задачи'
            : 'задач'
)

/**
 * MobileDrawer — сайдбар на телефоне.
 *
 * Тот же состав, что у десктопного Sidebar (профиль, закреплённые доски и
 * проекты, групповая доска, шаблоны/гайды, календарь, статистика/
 * лидерборд, дерево с дневной целью, помощь, настройки, выход), но
 * выезжает слева по кнопке ☰ в шапке, а не занимает 240px экрана.
 *
 * Почему отдельный компонент, а не Sidebar с CSS-классом: десктопный
 * Sidebar стоит в потоке и умеет сворачиваться в полоску, у него своя
 * кнопка «свернуть» и «свёрнутый» режим текста. На телефоне это всё
 * лишнее, а панель ещё должна уметь: уйти по тапу на пункт, закрыться по
 * тапу на фон, по Escape (AppLayout) и по системной кнопке «назад».
 *
 * Пункты навигации — NavLink, а не кнопки: ссылку можно открыть в новой
 * вкладке, и подсветка активного раздела достаётся бесплатно.
 */
export default observer(function MobileDrawer() {
    const { user, logout } = useAuth()
    const t = useT()
    const dispatch = useDispatch()
    const ui = useUiStore()
    const isMobile = useIsMobile()

    const activeAvatar = useSelector(selectActiveAvatar)
    const activeFrame = useSelector(selectActiveFrame)

    const boards = useSelector(selectPinnedBoards)
    const projectsByBoard = useSelector(selectPinnedProjectsByBoard)
    const groupProjects = useSelector(selectGroupProjects)

    const doneTasks = useSelector(selectDoneToday)
    const dailyGoal = useSelector(selectDailyGoal)
    const claimingGoal = useSelector(selectClaimingDailyGoal)

    const open = ui.mobileMenuOpen
    const [boardsOpen, setBoardsOpen] = useState(true)
    const [groupOpen, setGroupOpen] = useState(true)
    const [showLogout, setShowLogout] = useState(false)
    const [treeOpen, setTreeOpen] = useState(() => {
        try { return localStorage.getItem('sidebar:treeOpen') !== '0' } catch { return true }
    })

    const close = () => ui.closeMobileMenu()

    const toggleTree = () => {
        setTreeOpen(v => {
            const next = !v
            try { localStorage.setItem('sidebar:treeOpen', next ? '1' : '0') } catch { /* ignore */ }
            return next
        })
    }

    // Пиннутые доски и групповая — грузим один раз на телефоне: данные
    // нужны для списка внутри панели. Инвалидация после мутаций идёт через
    // dispatch(fetchPinned()) из точек мутации, как и в Sidebar.
    useEffect(() => {
        if (!isMobile) return
        dispatch(fetchPinned())
        dispatch(fetchGroupProjects())
    }, [isMobile, dispatch])

    // Дерево: дневная сводка нужна, только пока панель открыта.
    useEffect(() => {
        if (!user || !isMobile || !open) return
        dispatch(fetchStats('day'))
        dispatch(fetchDailyGoal())
    }, [user, isMobile, open, dispatch])

    // Поворот/расширение окна: панель, оставленная открытой, не должна
    // «висеть» на десктопе, где меню — это обычный Sidebar.
    useEffect(() => {
        if (!isMobile && ui.mobileMenuOpen) ui.closeMobileMenu()
    }, [isMobile, ui])

    // Системная кнопка «назад» и кнопка браузера закрывают панель, а не
    // уводят со страницы. Тот же приём, что у поиска в MobileTopBar:
    // искусственная запись истории + popstate.
    const openRef = useRef(false)
    openRef.current = open
    useEffect(() => {
        if (!open) return undefined
        window.history.pushState({ mobileDrawer: true }, '')
        const onPop = () => ui.closeMobileMenu()
        window.addEventListener('popstate', onPop)
        return () => {
            window.removeEventListener('popstate', onPop)
            // Ушли на другой маршрут, не закрыв панель: запись истории
            // нужно убрать, иначе «назад» вернёт пустую страницу.
            if (openRef.current && window.history.state?.mobileDrawer) {
                window.history.back()
            }
        }
    }, [open, ui])

    const treeKind = useSelector(
        (state) => state.shop.data?.treeSkins?.find(s => s.active)?.code,
    ) || user?.appearance?.treeKind || 'sakura'

    const treeEnabledByUser = user?.appearance?.treeEnabled !== false
    const treeVisible = treeEnabledByUser && ui.treeEnabledLocal

    const displayName = user?.profile?.displayName || user?.username || 'User'

    const treeDone = dailyGoal?.done ?? doneTasks
    const goalTarget = dailyGoal?.target ?? 10
    const tierLabel = TIER_LABELS[dailyGoal?.tier] || TIER_LABELS.none
    const nextTierLabel = dailyGoal?.nextTier ? TIER_LABELS[dailyGoal.nextTier] : null
    const nextRemaining = dailyGoal?.nextTierAt != null
        ? Math.max(0, dailyGoal.nextTierAt - treeDone)
        : 0
    const canClaim = Boolean(dailyGoal?.canClaim) && !claimingGoal

    const goalSegments = 10
    const filledSegments = goalTarget > 0
        ? Math.min(goalSegments, Math.round((treeDone / goalTarget) * goalSegments))
        : 0

    let dailyHint = null
    if (dailyGoal?.claimed) {
        dailyHint = 'Награда за сегодня уже получена'
    } else if (canClaim) {
        dailyHint = `Кликни по дереву, чтобы забрать ${dailyGoal.rewardLeaves} 🍃`
    } else if (nextTierLabel) {
        dailyHint = `Ещё ${nextRemaining} ${pluralTasks(nextRemaining)} до «${nextTierLabel}»`
    } else if (dailyGoal) {
        dailyHint = 'Цель дня выполнена — легендарный день!'
    }

    const handleClaim = () => {
        if (canClaim) dispatch(claimDailyGoal())
    }

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
        } catch { /* сеть упала — список просто останется прежним */ }
    }

    const handleUnpinProject = async (project) => {
        try {
            await projectsApi.update(project.id, { isPinned: false })
            dispatch(fetchPinned())
        } catch { /* см. выше */ }
    }

    // На десктопе панели нет вовсе — там свой Sidebar. Ветка возвращает
    // null: компонент в AppLayout смонтирован всегда (как MobileTopBar),
    // но ничего не добавляет в десктопную разметку.
    if (!isMobile) return null

    return (
        <>
            <div className={`mobile-drawer ${open ? 'mobile-drawer--open' : ''}`} aria-hidden={!open}>
                <button
                    type="button"
                    className="mobile-drawer__scrim"
                    onClick={close}
                    tabIndex={-1}
                    aria-label="Закрыть меню"
                />

                <aside
                    className="mobile-drawer__panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Меню"
                    inert={!open}
                >
                    <div className="mobile-drawer__user">
                        <Link to="/" className="mobile-drawer__avatar" onClick={close} title="Главная">
                            <AvatarWithFrame
                                avatar={activeAvatar}
                                frame={activeFrame}
                                displayName={displayName}
                                username={user?.username}
                                size={44}
                            />
                        </Link>
                        <div className="mobile-drawer__meta">
                            <div className="mobile-drawer__name" title={displayName}>{displayName}</div>
                            <Link to="/profile" className="mobile-drawer__profile-link" onClick={close}>
                                смотреть профиль
                            </Link>
                        </div>
                        <button
                            type="button"
                            className="mobile-icon-btn"
                            onClick={close}
                            aria-label="Закрыть меню"
                        >
                            ✕
                        </button>
                    </div>

                    <nav className="mobile-drawer__nav" aria-label="Разделы">
                        <div className="mobile-drawer__group-row">
                            <NavLink
                                to="/boards"
                                className={({ isActive }) =>
                                    `mobile-drawer__link ${isActive ? 'active' : ''}`}
                                onClick={close}
                            >
                                <span className="mobile-drawer__icon" aria-hidden="true">📋</span>
                                <span>{t.boards || 'Доски'}</span>
                            </NavLink>
                            {hasPinned && (
                                <button
                                    type="button"
                                    className="mobile-drawer__toggle"
                                    onClick={() => setBoardsOpen(v => !v)}
                                    aria-expanded={boardsOpen}
                                    title={boardsOpen ? 'Свернуть' : 'Развернуть'}
                                >
                                    <span className={`mobile-drawer__caret ${boardsOpen ? 'mobile-drawer__caret--open' : ''}`}>
                                        ▸
                                    </span>
                                </button>
                            )}
                        </div>

                        {boardsOpen && hasPinned && (
                            <div className="mobile-drawer__subnav">
                                {visibleBoards.map(b => (
                                    <div key={b.id} className="mobile-drawer__pinned-board">
                                        <div className="mobile-drawer__sublink-row">
                                            <NavLink
                                                to={`/boards/${b.id}`}
                                                className={({ isActive }) =>
                                                    `mobile-drawer__sublink ${isActive ? 'active' : ''}`
                                                }
                                                onClick={close}
                                            >{b.title}</NavLink>
                                            {b.isPinned && (
                                                <button
                                                    type="button"
                                                    className="mobile-drawer__unpin"
                                                    onClick={() => handleUnpinBoard(b)}
                                                    title="Открепить доску"
                                                >📌</button>
                                            )}
                                        </div>
                                        {(visibleProjects[b.id] || []).length > 0 && (
                                            <div className="mobile-drawer__pinned-projects">
                                                {(visibleProjects[b.id] || []).map(p => (
                                                    <div key={p.id} className="mobile-drawer__sublink-row">
                                                        <NavLink
                                                            to={`/boards/${b.id}/projects/${p.id}`}
                                                            className={({ isActive }) =>
                                                                `mobile-drawer__sublink mobile-drawer__sublink--project ${isActive ? 'active' : ''}`
                                                            }
                                                            onClick={close}
                                                        >{p.title}</NavLink>
                                                        {p.isPinned && (
                                                            <button
                                                                type="button"
                                                                className="mobile-drawer__unpin"
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

                        {boardsOpen && !hasPinned && (
                            <div className="mobile-drawer__hint">
                                {t.noPinned || 'Закрепите доску, чтобы она была здесь'}
                            </div>
                        )}

                        <div className="mobile-drawer__group-row">
                            <NavLink
                                to="/group"
                                end
                                className={({ isActive }) =>
                                    `mobile-drawer__link ${isActive ? 'active' : ''}`
                                }
                                onClick={close}
                            >
                                <span className="mobile-drawer__icon" aria-hidden="true">👥</span>
                                <span>{t.groupBoardShort || 'Групповая'}</span>
                            </NavLink>
                            {groupProjects.length > 0 && (
                                <button
                                    type="button"
                                    className="mobile-drawer__toggle"
                                    onClick={() => setGroupOpen(v => !v)}
                                    aria-expanded={groupOpen}
                                    title={groupOpen ? 'Свернуть' : 'Развернуть'}
                                >
                                    <span className={`mobile-drawer__caret ${groupOpen ? 'mobile-drawer__caret--open' : ''}`}>
                                        ▸
                                    </span>
                                </button>
                            )}
                        </div>

                        {groupOpen && groupProjects.length > 0 && (
                            <div className="mobile-drawer__subnav">
                                {groupProjects.map(p => (
                                    <div key={p.id} className="mobile-drawer__sublink-row">
                                        <NavLink
                                            to={`/group/${p.id}`}
                                            className={({ isActive }) =>
                                                `mobile-drawer__sublink mobile-drawer__sublink--project ${isActive ? 'active' : ''}`
                                            }
                                            onClick={close}
                                        >{p.title}</NavLink>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mobile-drawer__divider" />

                        <NavLink
                            to="/templates"
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">🧩</span>
                            <span>{t.templates || 'Шаблоны'}</span>
                        </NavLink>

                        <div className="mobile-drawer__divider" />

                        <NavLink
                            to="/calendar"
                            end
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">📅</span>
                            <span>{t.calendar || 'Календарь'}</span>
                        </NavLink>

                        <NavLink
                            to="/stats"
                            end
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">📊</span>
                            <span>{t.stats || 'Статистика'}</span>
                        </NavLink>

                        <div className="mobile-drawer__divider" />

                        <NavLink
                            to="/shop"
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">🛒</span>
                            <span>Магазин</span>
                        </NavLink>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">👤</span>
                            <span>Профиль</span>
                        </NavLink>
                    </nav>

                    {treeVisible && (
                        <div className="mobile-drawer__tree">
                            <button
                                type="button"
                                className="mobile-drawer__tree-head"
                                onClick={toggleTree}
                                aria-expanded={treeOpen}
                            >
                                <span>🌳 Дерево</span>
                                <span className="mobile-drawer__tree-caret">{treeOpen ? '▾' : '▸'}</span>
                            </button>
                            {treeOpen && (
                                <>
                                    <TreeAvatar
                                        done={treeDone}
                                        kind={treeKind}
                                        maxHeight={400}
                                        canClaim={canClaim}
                                        onClaim={handleClaim}
                                        claiming={claimingGoal}
                                        claimed={Boolean(dailyGoal?.claimed)}
                                        claimReward={dailyGoal?.rewardLeaves ?? 0}
                                    />
                                    {dailyGoal ? (
                                        <div className="mobile-drawer__daily">
                                            <div className="mobile-drawer__daily-status">
                                                <span>🌿 {tierLabel}</span>
                                                <b>{treeDone} / {goalTarget}</b>
                                            </div>
                                            <div
                                                className="mobile-drawer__daily-progress"
                                                role="progressbar"
                                                aria-valuemin={0}
                                                aria-valuemax={goalTarget}
                                                aria-valuenow={Math.min(treeDone, goalTarget)}
                                            >
                                                {Array.from({ length: goalSegments }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={i < filledSegments
                                                            ? 'mobile-drawer__daily-segment mobile-drawer__daily-segment--filled'
                                                            : 'mobile-drawer__daily-segment'}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mobile-drawer__tree-hint">{dailyHint}</div>
                                        </div>
                                    ) : (
                                        <div className="mobile-drawer__tree-hint">
                                            Растёт от выполненных задач. Клик — листья.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="mobile-drawer__bottom">
                        <NavLink
                            to="/help"
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">❓</span>
                            <span>{t.help || 'Помощь'}</span>
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `mobile-drawer__link ${isActive ? 'active' : ''}`
                            }
                            onClick={close}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">⚙</span>
                            <span>{t.settings || 'Настройки'}</span>
                        </NavLink>
                        {user?.isAdmin && (
                            <NavLink
                                to="/admin/shop"
                                className={({ isActive }) =>
                                    `mobile-drawer__link ${isActive ? 'active' : ''}`
                                }
                                onClick={close}
                            >
                                <span className="mobile-drawer__icon" aria-hidden="true">🛠</span>
                                <span>Админка магазина</span>
                            </NavLink>
                        )}
                        <button
                            type="button"
                            className="mobile-drawer__link mobile-drawer__link--danger"
                            onClick={() => setShowLogout(true)}
                        >
                            <span className="mobile-drawer__icon" aria-hidden="true">⎋</span>
                            <span>{t.logout || 'Выйти'}</span>
                        </button>
                    </div>
                </aside>
            </div>

            <ConfirmModal
                open={showLogout}
                title={t.confirmLogoutTitle}
                text={t.confirmLogoutText}
                confirmLabel={t.yesLogout}
                cancelLabel={t.cancel}
                danger
                onConfirm={() => {
                    setShowLogout(false)
                    ui.closeMobileMenu()
                    logout()
                }}
                onClose={() => setShowLogout(false)}
            />
        </>
    )
})
