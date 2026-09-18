import { useParams, useNavigate } from 'react-router-dom'
import KanbanColumn from '../components/Board/KanbanColumn'

const STATUSES = [
    { key: 'ACTIVE',   label: 'В процессе'  },
    { key: 'DONE',     label: 'Выполненные' },
    { key: 'ARCHIVED', label: 'Архив'       },
]

// Демо-данные. Позже — fetch(`/api/boards/${id}`)
const demoBoard = {
    id: 1,
    title: 'Task Board',
    tasks: [
        { id: 101, title: "Improve 'Hide empty lane'",           status: 'ACTIVE',   tag: '#135262' },
        { id: 102, title: 'Comment permissions processed',        status: 'ACTIVE',   tag: '#137880' },
        { id: 103, title: 'Export to CSV only selected fields',   status: 'ACTIVE',   tag: '#135555' },
        { id: 104, title: 'View top filter redesign',             status: 'ACTIVE',   tag: '#135253' },
        { id: 105, title: 'Owner filter autofill',                status: 'ACTIVE',   tag: '#135252' },
        { id: 106, title: 'Add and open',                         status: 'ACTIVE',   tag: '#135660' },
        { id: 107, title: "'Add and open' doesn't work",          status: 'ACTIVE',   tag: '#135666' },
        { id: 108, title: 'Refactor auth module',                 status: 'ACTIVE',   tag: '#135777' },
        { id: 109, title: 'Fix sidebar scroll on mobile',         status: 'ACTIVE',   tag: '#135888' },
        { id: 110, title: 'Update dependencies',                  status: 'ACTIVE',   tag: '#135123' },
        { id: 111, title: 'Migrate to React 19',                  status: 'ACTIVE',   tag: '#135124' },
        { id: 112, title: 'Redesign dashboard header',            status: 'ACTIVE',   tag: '#135125' },
        { id: 113, title: 'Improve error handling',               status: 'ACTIVE',   tag: '#135126' },
        { id: 114, title: 'Add unit tests for KanbanColumn',      status: 'ACTIVE',   tag: '#135127' },
        { id: 115, title: 'Optimize database queries',            status: 'ACTIVE',   tag: '#135128' },

        { id: 201, title: 'Unit tests for BoardService',          status: 'DONE',     tag: '#135999' },
        { id: 202, title: 'Setup CI pipeline',                    status: 'DONE',     tag: '#135000' },
        { id: 203, title: 'Initial PostgreSQL schema',            status: 'DONE',     tag: '#130200' },

        { id: 301, title: 'Old auth flow (deprecated)',           status: 'ARCHIVED', tag: '#130100' },
        { id: 302, title: 'Legacy import script',                 status: 'ARCHIVED', tag: '#130101' },
    ],
}

export default function BoardDetailPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const board = demoBoard
    const boardId = Number(id)

    return (
        <div className="board-detail">
            <div className="board-detail__head">
                <button
                    className="btn btn-ghost"
                    onClick={() => nav('/boards')}
                    title="Назад"
                >
                    ←
                </button>
                <h2 className="board-detail__title">{board.title}</h2>
            </div>

            <div className="board-detail__scroll">
                <div className="kanban">
                    {STATUSES.map(s => (
                        <KanbanColumn
                            key={s.key}
                            status={s.key}
                            label={s.label}
                            boardId={boardId}
                            tasks={board.tasks.filter(t => t.status === s.key)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}