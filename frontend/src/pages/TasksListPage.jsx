import { useNavigate, useSearchParams } from 'react-router-dom'

// Все задачи с привязкой к доске (boardId)
const ALL_TASKS = [
    // Board 1 — Task Board
    { id: 101, title: "Improve 'Hide empty lane'",          status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135262', deadline: '2026-09-20' },
    { id: 102, title: 'Comment permissions processed',       status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#137880', deadline: '2026-09-22' },
    { id: 103, title: 'Export to CSV only selected fields',  status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135555', deadline: '2026-09-25' },
    { id: 104, title: 'View top filter redesign',            status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135253', deadline: '2026-09-28' },
    { id: 105, title: 'Owner filter autofill',               status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135252', deadline: '2026-10-01' },
    { id: 106, title: 'Add and open',                        status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135660', deadline: '2026-10-03' },
    { id: 107, title: 'Refactor auth module',                status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135777', deadline: '2026-09-19' },
    { id: 108, title: 'Fix sidebar scroll on mobile',        status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135888', deadline: '2026-09-21' },
    { id: 109, title: 'Update dependencies',                 status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135123', deadline: '2026-09-24' },
    { id: 110, title: 'Migrate to React 19',                 status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135124', deadline: '2026-09-29' },
    { id: 111, title: 'Redesign dashboard header',           status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135125', deadline: '2026-10-05' },
    { id: 112, title: 'Accessibility audit',                 status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135129', deadline: '2026-10-06' },
    { id: 113, title: 'Dark theme support',                  status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135131', deadline: '2026-10-08' },
    { id: 114, title: 'Notification system',                 status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135132', deadline: '2026-10-10' },
    { id: 115, title: 'Export to PDF',                       status: 'ACTIVE',   boardId: 1, board: 'Task Board',    tag: '#135133', deadline: '2026-10-12' },

    // Board 2 — Svekla kanban
    { id: 201, title: 'Review design mockups',               status: 'ACTIVE',   boardId: 2, board: 'Svekla kanban', tag: '#200001', deadline: '2026-10-05' },
    { id: 202, title: 'Set up staging',                      status: 'ACTIVE',   boardId: 2, board: 'Svekla kanban', tag: '#200002', deadline: '2026-10-08' },
    { id: 203, title: 'Add translations',                    status: 'ACTIVE',   boardId: 2, board: 'Svekla kanban', tag: '#200003', deadline: '2026-10-10' },
    { id: 204, title: 'Integrate analytics',                 status: 'ACTIVE',   boardId: 2, board: 'Svekla kanban', tag: '#200004', deadline: '2026-10-15' },

    // Board 4 — Диплом / РПЗ
    { id: 401, title: 'Оформить титульник',                  status: 'ACTIVE',   boardId: 4, board: 'Диплом / РПЗ',  tag: '#400001', deadline: '2026-10-01' },
    { id: 402, title: 'Написать раздел «Введение»',          status: 'ACTIVE',   boardId: 4, board: 'Диплом / РПЗ',  tag: '#400002', deadline: '2026-10-05' },
    { id: 403, title: 'Сделать UML-диаграммы',               status: 'ACTIVE',   boardId: 4, board: 'Диплом / РПЗ',  tag: '#400003', deadline: '2026-10-10' },
    { id: 404, title: 'Согласовать с руководителем',         status: 'ACTIVE',   boardId: 4, board: 'Диплом / РПЗ',  tag: '#400004', deadline: '2026-10-15' },
    { id: 405, title: 'Подготовить доклад',                  status: 'ACTIVE',   boardId: 4, board: 'Диплом / РПЗ',  tag: '#400005', deadline: '2026-10-20' },

    // DONE
    { id: 501, title: 'Unit tests for BoardService',         status: 'DONE',     boardId: 1, board: 'Task Board',    tag: '#135999', deadline: '2026-09-10' },
    { id: 502, title: 'Setup CI pipeline',                   status: 'DONE',     boardId: 1, board: 'Task Board',    tag: '#135000', deadline: '2026-09-05' },
    { id: 503, title: 'Initial PostgreSQL schema',           status: 'DONE',     boardId: 1, board: 'Task Board',    tag: '#130200', deadline: '2026-09-01' },
    { id: 504, title: 'Установить PostgreSQL',               status: 'DONE',     boardId: 4, board: 'Диплом / РПЗ',  tag: '#400010', deadline: '2026-09-01' },
    { id: 505, title: 'Создать репозиторий',                 status: 'DONE',     boardId: 4, board: 'Диплом / РПЗ',  tag: '#400011', deadline: '2026-09-02' },

    // ARCHIVED
    { id: 601, title: 'Old auth flow (deprecated)',          status: 'ARCHIVED', boardId: 1, board: 'Task Board',    tag: '#130100', deadline: '2025-12-15' },
    { id: 602, title: 'Legacy import script',                status: 'ARCHIVED', boardId: 1, board: 'Task Board',    tag: '#130101', deadline: '2025-11-30' },
    { id: 603, title: 'Ранняя версия ТЗ',                    status: 'ARCHIVED', boardId: 4, board: 'Диплом / РПЗ',  tag: '#400020', deadline: '2026-08-01' },
]

const STATUS_CONFIG = {
    ACTIVE: {
        label: 'В процессе',
        dot: 'var(--col-open)',
        emptyText: 'Нет активных задач',
        countLabel: (n) => `${n} ${plural(n, ['задача', 'задачи', 'задач'])} сейчас в работе`,
    },
    DONE: {
        label: 'Выполненные',
        dot: 'var(--col-done)',
        emptyText: 'Пока нет выполненных задач',
        countLabel: (n) => `${n} ${plural(n, ['задача', 'задачи', 'задач'])} выполнено`,
    },
    ARCHIVED: {
        label: 'Архив',
        dot: '#97a0af',
        emptyText: 'Архив пуст',
        countLabel: (n) => `${n} ${plural(n, ['задача', 'задачи', 'задач'])} в архиве`,
    },
}

export default function TasksListPage({ status }) {
    const nav = useNavigate()
    const [params] = useSearchParams()

    const boardId = params.get('board') ? Number(params.get('board')) : null

    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE

    // Фильтр: сначала по статусу, потом по доске (если задана)
    let tasks = ALL_TASKS.filter(t => t.status === status)
    if (boardId) tasks = tasks.filter(t => t.boardId === boardId)

    const now = new Date()
    const showDeadline = status !== 'ARCHIVED'
    const overdueCount = status === 'ACTIVE'
        ? tasks.filter(t => new Date(t.deadline) < now).length
        : 0

    // Название текущего контекста
    const boardName = boardId && tasks.length > 0
        ? tasks[0].board
        : (boardId ? `Доска #${boardId}` : null)

    return (
        <div className={`task-list task-list--${status.toLowerCase()}`}>
            <div className="task-list__hero">
                <div>
                    <h1 className="task-list__title">
            <span
                className="task-list__dot"
                style={{ background: cfg.dot, boxShadow: `0 0 0 4px ${cfg.dot}29` }}
            />
                        {cfg.label}
                        {boardName && (
                            <span className="task-list__context"> · {boardName}</span>
                        )}
                    </h1>
                    <p className="task-list__sub">
                        {cfg.countLabel(tasks.length)}
                        {overdueCount > 0 && (
                            <>
                                {' · '}
                                <span className="task-list__overdue">
                  {overdueCount} {plural(overdueCount, ['просрочена', 'просрочены', 'просрочено'])}
                </span>
                            </>
                        )}
                    </p>
                </div>

                {status === 'ACTIVE' && (
                    <button className="btn btn-primary">+ Задача</button>
                )}
            </div>

            {tasks.length === 0 ? (
                <div className="task-list__empty">{cfg.emptyText}</div>
            ) : (
                <div className="task-list__list">
                    {tasks.map(t => {
                        const isOverdue = showDeadline && new Date(t.deadline) < now
                        return (
                            <div key={t.id} className="tl-task">
                                <div className="tl-task__check" />

                                <div className="tl-task__main">
                                    <div className="tl-task__title">{t.title}</div>
                                    <div className="tl-task__meta">
                                        <span className="tl-task__tag">{t.tag}</span>
                                        {!boardId && <span className="tl-task__board">{t.board}</span>}
                                    </div>
                                </div>

                                {showDeadline && (
                                    <div className={`tl-task__deadline ${isOverdue ? 'tl-task__deadline--overdue' : ''}`}>
                                        📅 {new Date(t.deadline).toLocaleDateString('ru-RU')}
                                        {isOverdue && <span className="tl-task__badge">просрочено</span>}
                                    </div>
                                )}

                                <button
                                    className="tl-task__open"
                                    onClick={() => nav(`/boards/${t.boardId}`)}
                                    title="Открыть доску"
                                >
                                    →
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}