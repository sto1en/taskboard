export default function TaskCard({ task }) {
    return (
        <div className="task-card">
            <div className="task-card__tag">{task.tag}</div>
            <div className="task-card__title">{task.title}</div>
        </div>
    )
}