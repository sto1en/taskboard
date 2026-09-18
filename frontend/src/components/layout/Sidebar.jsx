import { useState } from 'react'
import {
    NavLink,
    Link,
    useNavigate,
    useLocation,
    useParams,
    useSearchParams,
} from 'react-router-dom'

// Демо-список досок. Позже — fetch('/api/boards')
const DEMO_BOARDS = [
    { id: 1, title: 'Task Board',    activeCount: 15, doneCount: 3, archivedCount: 2 },
    { id: 2, title: 'Svekla kanban', activeCount: 4,  doneCount: 1, archivedCount: 0 },
    { id: 3, title: 'Estimations',   activeCount: 0,  doneCount: 0, archivedCount: 0 },
    { id: 4, title: 'Диплом / РПЗ',  activeCount: 5,  doneCount: 2, archivedCount: 1 },
]

export default function Sidebar() {
    const nav = useNavigate()
    const location = useLocation()
    const params = useParams()
    const [searchParams] = useSearchParams()

    const [boardsOpen, setBoardsOpen] = useState(true)

    // ============================================================
    // Определяем текущую доску из ДВУХ источников:
    //   1) path-параметр :id          → /boards/1
    //   2) query-параметр ?board=1    → /in-progress?board=1
    // ============================================================
    let currentBoardId = null

    if (location.pathname.startsWith('/boards/') && params.id) {
        currentBoardId = Number(params.id)
    } else if (searchParams.get('board')) {
        currentBoardId = Number(searchParams.get('board'))
    }

    const currentBoard = DEMO_BOARDS.find(b => b.id === currentBoardId)

    // Итоговые счётчики по всем доскам
    const totals = DEMO_BOARDS.reduce(
        (acc, b) => ({
            active: acc.active + b.activeCount,
            done: acc.done + b.doneCount,
            archived: acc.archived + b.archivedCount,
        }),
        { active: 0, done: 0, archived: 0 },
    )

    // Контекст для блока статусов
    const context = currentBoard
        ? {
            name: currentBoard.title,
            active: currentBoard.activeCount,
            done: currentBoard.doneCount,
            archived: currentBoard.archivedCount,
            boardId: currentBoard.id,
        }
        : {
            name: 'Все доски',
            active: totals.active,
            done: totals.done,
            archived: totals.archived,
            boardId: null,
        }

    return (
        <aside className="sidebar">
            <div className="sidebar__user">
                <div className="sidebar__avatar">A</div>
                <div className="sidebar__name">Andrew M.</div>
                <button
                    className="sidebar__logout"
                    title="Выйти"
                    onClick={() => nav('/login')}
                >
                    ⎋
                </button>
            </div>

            <nav className="sidebar__nav">
                {/* ===== Строка "Boards": ссылка + кнопка-стрелка ===== */}
                <div className="sidebar__group-row">
                    <Link to="/boards" className="sidebar__group-link">
                        <span className="sidebar__group-icon">📋</span>
                        <span>Boards</span>
                    </Link>

                    <button
                        className="sidebar__group-toggle"
                        onClick={() => setBoardsOpen(v => !v)}
                        title={boardsOpen ? 'Свернуть' : 'Развернуть'}
                    >
            <span className={`sidebar__caret ${boardsOpen ? 'sidebar__caret--open' : ''}`}>
              ▸
            </span>
                    </button>
                </div>

                {/* ===== Подсписок досок ===== */}
                {boardsOpen && (
                    <div className="sidebar__subnav">
                        {DEMO_BOARDS.map(b => (
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

                {/* ===== Заголовок: имя доски или "Все доски" ===== */}
                <div className="sidebar__caption">{context.name}</div>

                {/* ===== Статусы ===== */}
                <NavLink
                    to={context.boardId ? `/in-progress?board=${context.boardId}` : '/in-progress'}
                    className="sidebar__link sidebar__link--accent"
                >
                    <span className="sidebar__link-dot" style={{ background: 'var(--col-open)' }} />
                    <span>В процессе</span>
                    <span className="sidebar__link-badge">{context.active}</span>
                </NavLink>

                <NavLink
                    to={context.boardId ? `/done?board=${context.boardId}` : '/done'}
                    className="sidebar__link sidebar__link--accent"
                >
                    <span className="sidebar__link-dot" style={{ background: 'var(--col-done)' }} />
                    <span>Выполненные</span>
                    <span className="sidebar__link-badge">{context.done}</span>
                </NavLink>

                <NavLink
                    to={context.boardId ? `/archived?board=${context.boardId}` : '/archived'}
                    className="sidebar__link sidebar__link--accent"
                >
                    <span className="sidebar__link-dot" style={{ background: '#97a0af' }} />
                    <span>Архив</span>
                    <span className="sidebar__link-badge">{context.archived}</span>
                </NavLink>

                <div className="sidebar__divider" />

                <NavLink to="/calendar" className="sidebar__link">📅 Calendar</NavLink>
                <NavLink to="/stats" className="sidebar__link">📊 Stats</NavLink>
            </nav>

            <div className="sidebar__bottom">
                <a className="sidebar__link" href="#">❓ Help</a>
                <a className="sidebar__link" href="#">⚙ Settings</a>
            </div>
        </aside>
    )
}