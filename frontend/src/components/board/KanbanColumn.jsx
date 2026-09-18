import { Link } from 'react-router-dom'
import TaskCard from '../Task/TaskCard'

// Куда ведёт клик по шапке
const STATUS_ROUTES = {
    ACTIVE:   'in-progress',
    DONE:     'done',
    ARCHIVED: 'archived',
}

export default function KanbanColumn({ status, label, tasks = [], boardId }) {
    const slug = status.toLowerCase()
    const header = label || status
    const route = STATUS_ROUTES[status] || 'in-progress'
    const link = boardId ? `/${route}?board=${boardId}` : `/${route}`

    return (
        <div className={`kanban-col kanban-col--${slug}`}>
            <Link to={link} className="kanban-col__head">
                <span className="kanban-col__title">{header}</span>
                <span className="kanban-col__count">{tasks.length}</span>
                <span className="kanban-col__arrow">→</span>
            </Link>

            <div className="kanban-col__body">
                {tasks.map(t => (
                    <TaskCard key={t.id} task={t} />
                ))}
            </div>

            <button className="kanban-col__add">+ Добавить задачу</button>
        </div>
    )
}