import { useState, useEffect } from 'react'
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
import { projectsApi, boardsApi } from '../../api/api'
import useT from '../../hooks/useT'
import useConfirmDelete from '../../hooks/useConfirmDelete'
import { useAuth } from '../../context/AuthContext'
import SortableProjectCard from './SortableProjectCard'
import CreateProjectModal from './CreateProjectModal'
import EditProjectModal from './EditProjectModal'
import ConfirmModal from '../common/ConfirmModal'

export default function ProjectsGrid({
                                         projects,
                                         boardId,
                                         onProjectCreated,
                                         onProjectUpdated,
                                         onProjectDeleted,
                                     }) {
    const nav = useNavigate()
    const t = useT()
    const { user, updateUser } = useAuth()

    const [showCreate, setShowCreate] = useState(false)
    const [editProject, setEditProject] = useState(null)
    const [activeProject, setActiveProject] = useState(null)
    const [localOrder, setLocalOrder] = useState(null)

    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

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

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'project') {
                setShowCreate(true)
            }
        }
        window.addEventListener('hotkey:new', handler)
        return () => window.removeEventListener('hotkey:new', handler)
    }, [])

    const openProject = (projectId) => {
        if (!boardId) return
        nav(`/boards/${boardId}/projects/${projectId}`)
    }

    const countPins = async () => {
        const { data: allBoards } = await boardsApi.list()
        const pinnedBoards = allBoards.filter(b => b.isPinned)
        let count = 0
        for (const b of pinnedBoards) {
            const { data: projects } = await projectsApi.listByBoard(b.id)
            const pinnedProjects = projects.filter(p => p.isPinned)
            if (pinnedProjects.length > 0) {
                count += pinnedProjects.length
            } else {
                count += 1
            }
        }
        return count
    }

    const togglePin = async (project) => {
        try {
            if (!project.isPinned) {
                const count = await countPins()
                if (count >= 3) {
                    alert(t.maxPins)
                    return
                }
            }
            const { data } = await projectsApi.update(project.id, {
                isPinned: !project.isPinned,
            })
            onProjectUpdated && onProjectUpdated(data)
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Error')
        }
    }

    const handleDeleteClick = (project) => {
        if (project.isMain) {
            alert(t.mainProjectCantDelete)
            return
        }
        requestDelete({
            kind: 'project',
            title: project.title,
            onConfirm: async () => {
                await onProjectDeleted(project.id)
            },
        })
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
            window.dispatchEvent(new Event('sidebar:refresh'))
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
                                    onDeleteClick={() => handleDeleteClick(p)}
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
                            <span>{t.newProject}</span>
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
                onCreated={(newProject) => {
                    onProjectCreated && onProjectCreated(newProject)
                    window.dispatchEvent(new Event('sidebar:refresh'))
                }}
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

            <ConfirmModal {...modalProps} />
        </>
    )
}

function ProjectCard({ project, onClick, onDeleteClick, onEdit, onTogglePin }) {
    const t = useT()
    const accent = project.accentCode || 'blue'
    const total = project.taskTotal || 0
    const done = project.taskDone || 0
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const hasCover = !!project.coverUrl

    const handleDelete = (e) => {
        e.stopPropagation()
        onDeleteClick && onDeleteClick()
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
                        title={project.isPinned ? t.unpin : t.pin}
                    >
                        📌
                    </button>
                    <button
                        className="project-card__action-btn"
                        onClick={handleEdit}
                        title={t.edit}
                    >
                        ✎
                    </button>
                    {!project.isMain && (
                        <button
                            className="project-card__action-btn project-card__action-btn--danger"
                            onClick={handleDelete}
                            title={t.delete}
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
                        {t.tasksDoneOf(done, total)}
                    </div>
                </div>
            </div>
        </div>
    )
}