import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    rectSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { projectsApi } from '../../api/api'
import SortableProjectCard from './SortableProjectCard'
import CreateProjectModal from './CreateProjectModal'
import EditProjectModal from './EditProjectModal'

export default function ProjectsGrid({
                                         projects,
                                         boardId,
                                         onProjectCreated,
                                         onProjectUpdated,
                                         onProjectDeleted,
                                     }) {
    const nav = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [editProject, setEditProject] = useState(null)
    const [activeProject, setActiveProject] = useState(null)
    const [localOrder, setLocalOrder] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const sorted = localOrder || [...projects].sort((a, b) => {
        const pinA = a.isPinned ? 0 : 1
        const pinB = b.isPinned ? 0 : 1
        if (pinA !== pinB) return pinA - pinB
        return (a.position || 0) - (b.position || 0)
    })

    const openProject = (projectId) => {
        if (!boardId) return
        nav(`/boards/${boardId}/projects/${projectId}`)
    }

    const togglePin = async (project) => {
        try {
            const { data } = await projectsApi.update(project.id, {
                isPinned: !project.isPinned,
            })
            onProjectUpdated && onProjectUpdated(data)
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const handleDragStart = (event) => {
        const { active } = event
        const project = active.data.current?.project
        if (project) setActiveProject(project)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveProject(null)
        if (!over || active.id === over.id) {
            setLocalOrder(null)
            return
        }

        const activePr = sorted.find(p => p.id === active.id)
        const overPr = sorted.find(p => p.id === over.id)
        if (!activePr || !overPr) {
            setLocalOrder(null)
            return
        }

        if (activePr.isPinned !== overPr.isPinned) {
            setLocalOrder(null)
            return
        }

        const oldIndex = sorted.findIndex(p => p.id === active.id)
        const newIndex = sorted.findIndex(p => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(sorted, oldIndex, newIndex)
        setLocalOrder(reordered)

        const updated = reordered.map((p, idx) => ({ ...p, position: idx }))

        try {
            await Promise.all(
                updated.map(p => projectsApi.move(p.id, { position: p.position }))
            )
            updated.forEach(p => onProjectUpdated && onProjectUpdated(p))
            setLocalOrder(null)
        } catch (err) {
            console.error('Move failed:', err)
            setLocalOrder(null)
        }
    }

    const projectIds = sorted.map(p => p.id)

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={projectIds} strategy={rectSortingStrategy}>
                    <div className="projects-grid">
                        {sorted.map(p => (
                            <SortableProjectCard key={p.id} project={p}>
                                <ProjectCard
                                    project={p}
                                    onClick={() => openProject(p.id)}
                                    onDelete={onProjectDeleted}
                                    onEdit={() => setEditProject(p)}
                                    onTogglePin={() => togglePin(p)}
                                />
                            </SortableProjectCard>
                        ))}

                        <button
                            className="project-card project-card--new"
                            onClick={() => setShowCreate(true)}
                        >
                            <span className="project-card__plus">+</span>
                            <span>Новый проект</span>
                        </button>
                    </div>
                </SortableContext>

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } },
                        }),
                    }}
                >
                    {activeProject ? (
                        <div style={{ width: 240 }}>
                            <ProjectCard project={activeProject} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <CreateProjectModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={onProjectCreated}
                boardId={boardId}
            />

            <EditProjectModal
                open={!!editProject}
                onClose={() => setEditProject(null)}
                project={editProject}
                boardId={boardId}
                onUpdated={(updated) => {
                    onProjectUpdated && onProjectUpdated(updated)
                    setEditProject(null)
                }}
            />
        </>
    )
}

function ProjectCard({ project, onClick, onDelete, onEdit, onTogglePin }) {
    const accent = project.accentCode || 'blue'
    const total = project.taskTotal || 0
    const done = project.taskDone || 0
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const hasCover = !!project.coverUrl

    const handleDelete = (e) => {
        e.stopPropagation()
        if (project.isMain) {
            alert('Нельзя удалить главный проект доски')
            return
        }
        if (confirm(`Удалить проект "${project.title}"? Все задачи будут удалены.`)) {
            onDelete && onDelete(project.id)
        }
    }

    const handleEdit = (e) => {
        e.stopPropagation()
        onEdit && onEdit()
    }

    const handlePin = (e) => {
        e.stopPropagation()
        onTogglePin && onTogglePin()
    }

    return (
        <div
            className={`project-card ${project.isPinned ? 'project-card--pinned' : ''}`}
            onClick={onClick}
        >
            <div className={`project-card__cover project-card__cover--${accent}`}>
                {hasCover ? (
                    <img
                        src={project.coverUrl}
                        alt=""
                        className="project-card__cover-img"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                ) : (
                    <>
                        <div className="project-card__pattern" />
                        <div className="project-card__cover-title">
                            {project.title}
                        </div>
                        {project.statusTitle && (
                            <div className="project-card__cover-status">
                                {project.statusTitle}
                            </div>
                        )}
                    </>
                )}

                <div className="project-card__actions">
                    <button
                        className={`project-card__action-btn ${project.isPinned ? 'project-card__action-btn--active' : ''}`}
                        onClick={handlePin}
                        title={project.isPinned ? 'Открепить' : 'Закрепить'}
                    >
                        📌
                    </button>
                    <button
                        className="project-card__action-btn"
                        onClick={handleEdit}
                        title="Редактировать"
                    >
                        ✎
                    </button>
                    {!project.isMain && (
                        <button
                            className="project-card__action-btn project-card__action-btn--danger"
                            onClick={handleDelete}
                            title="Удалить"
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>

            <div className="project-card__body">
                <div className="project-card__title">{project.title}</div>
                {project.statusTitle && (
                    <div className="project-card__status">{project.statusTitle}</div>
                )}

                <div className="project-card__progress">
                    <div className="project-card__progress-bar">
                        <div
                            className="project-card__progress-fill"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="project-card__progress-text">
                        <span className="project-card__done">{done}</span>
                        {' / '}{total} задач выполнено
                    </div>
                </div>
            </div>
        </div>
    )
}