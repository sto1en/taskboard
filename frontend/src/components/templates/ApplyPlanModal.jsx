import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../modal/Modal'
import { boardsApi, projectsApi } from '../../api/api'

function todayIso() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function mondayOf(iso) {
    const d = new Date(`${iso}T12:00:00`)
    const shift = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - shift)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isoPlusDays(iso, days) {
    const d = new Date(`${iso}T12:00:00`)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const offsetOf = (item) => item.deadlineOffsetDays ?? item.dayOffset ?? null

/**
 * Единое окно применения шаблона/гайда: выбор доски, проекта,
 * даты старта и создание реальных задач.
 */
export default function ApplyPlanModal({
    open,
    onClose,
    title = 'Применить план',
    plan = [],
    defaultProjectTitle = '',
    defaultProjectDescription = '',
    onApply,
    weekMode = false,
}) {
    const nav = useNavigate()

    const [boards, setBoards] = useState([])
    const [projects, setProjects] = useState([])
    const [boardId, setBoardId] = useState('')
    const [projectId, setProjectId] = useState('')
    const [createProject, setCreateProject] = useState(false)
    const [projectTitle, setProjectTitle] = useState('')
    const [startDate, setStartDate] = useState(todayIso())
    const [includeSubtasks, setIncludeSubtasks] = useState(true)

    const [loading, setLoading] = useState(false)
    const [applying, setApplying] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    useEffect(() => {
        if (!open) return
        setResult(null)
        setError('')
        setCreateProject(false)
        setStartDate(weekMode ? mondayOf(todayIso()) : todayIso())
        setProjectTitle(defaultProjectTitle)
        setIncludeSubtasks(true)

        setLoading(true)
        boardsApi.list()
            .then(({ data }) => {
                setBoards(data || [])
                const first = (data || [])[0]
                setBoardId(first ? String(first.id) : '')
            })
            .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить доски'))
            .finally(() => setLoading(false))
    }, [open, defaultProjectTitle, weekMode])

    useEffect(() => {
        if (!open || !boardId) {
            setProjects([])
            return
        }
        let cancelled = false
        projectsApi.listByBoard(boardId)
            .then(({ data }) => {
                if (cancelled) return
                const list = data || []
                setProjects(list)
                const main = list.find(p => p.isMain) || list[0]
                setProjectId(main ? String(main.id) : '')
                if (list.length === 0) setCreateProject(true)
            })
            .catch(() => { if (!cancelled) setProjects([]) })
        return () => { cancelled = true }
    }, [open, boardId])

    const taskCount = plan.length
    const subtaskCount = useMemo(
        () => plan.reduce((sum, item) => sum + (item.subtasks?.length || 0), 0),
        [plan]
    )

    const preview = useMemo(() => {
        return [...plan]
            .sort((a, b) => (offsetOf(a) ?? 0) - (offsetOf(b) ?? 0))
            .slice(0, 6)
    }, [plan])

    const handleApply = async () => {
        if (!boardId) {
            setError('Выберите доску')
            return
        }
        if (!createProject && !projectId) {
            setError('Выберите проект или создайте новый')
            return
        }
        setApplying(true)
        setError('')
        try {
            const payload = {
                boardId: Number(boardId),
                projectId: createProject ? null : Number(projectId),
                createProject,
                projectTitle: createProject ? (projectTitle || defaultProjectTitle) : null,
                projectDescription: createProject ? defaultProjectDescription : null,
                startDate,
                includeSubtasks,
            }
            const data = await onApply(payload)
            setResult(data)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Не удалось применить план')
        } finally {
            setApplying(false)
        }
    }

    const footer = result ? (
        <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Закрыть</button>
            <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                    onClose()
                    const board = boards.find(b => String(b.id) === String(boardId))
                    if (board) nav(`/boards/${board.id}/projects/${result.projectId}`)
                }}
            >
                Открыть проект
            </button>
        </>
    ) : (
        <>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={applying}>
                Отмена
            </button>
            <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
                disabled={applying || loading || taskCount === 0}
            >
                {applying ? 'Добавляем…' : `Добавить ${taskCount} задач`}
            </button>
        </>
    )

    return (
        <Modal open={open} onClose={onClose} title={title} footer={footer} className="apply-plan-modal">
            {result ? (
                <div className="apply-plan__success">
                    <div className="apply-plan__success-icon">✅</div>
                    <h4>Готово!</h4>
                    <p>{result.message || `Добавлено задач: ${result.createdTasks}`}</p>
                    <p className="apply-plan__success-project">
                        Проект: <b>{result.projectTitle}</b>
                    </p>
                </div>
            ) : (
                <div className="apply-plan">
                    <div className="apply-plan__summary">
                        <span>🧩 Задач: <b>{taskCount}</b></span>
                        {subtaskCount > 0 && <span>☑️ Подзадач: <b>{subtaskCount}</b></span>}
                        <span>📅 Старт: <b>{formatDate(startDate)}</b></span>
                    </div>

                    {loading ? (
                        <div className="loading">Загружаем доски…</div>
                    ) : (
                        <div className="apply-plan__form">
                            <label className="field">
                                <span className="field__label">Доска</span>
                                <select
                                    className="input"
                                    value={boardId}
                                    onChange={(e) => setBoardId(e.target.value)}
                                >
                                    <option value="">— выберите доску —</option>
                                    {boards.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="field">
                                <span className="field__label">
                                    {weekMode ? 'Неделя старта' : 'Дата старта'}
                                </span>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (!value) return
                                        setStartDate(weekMode ? mondayOf(value) : value)
                                    }}
                                />
                                <span className="field__hint">
                                    {weekMode
                                        ? 'Шаблон привязан к дням недели: ПН — первый день выбранной недели. Даты задач пересчитаются автоматически. Если у задачи выбран час слота, он станет временем дедлайна.'
                                        : `Дедлайны считаются от этой даты. День 0 = ${formatDate(startDate)}.`}
                                </span>
                            </label>

                            {createProject ? (
                                <label className="field">
                                    <span className="field__label">Название нового проекта</span>
                                    <input
                                        className="input"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Например: Неделя ясности"
                                    />
                                </label>
                            ) : (
                                <label className="field">
                                    <span className="field__label">Проект</span>
                                    <select
                                        className="input"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                    >
                                        <option value="">— выберите проект —</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}{p.isMain ? ' (основной)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            <div className="apply-plan__toggles">
                                <label className="check">
                                    <input
                                        type="checkbox"
                                        checked={createProject}
                                        onChange={(e) => setCreateProject(e.target.checked)}
                                    />
                                    <span>Создать новый проект на доске</span>
                                </label>
                                <label className="check">
                                    <input
                                        type="checkbox"
                                        checked={includeSubtasks}
                                        onChange={(e) => setIncludeSubtasks(e.target.checked)}
                                    />
                                    <span>Добавлять подзадачи</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="apply-plan__preview">
                            <div className="apply-plan__preview-title">Что появится на доске</div>
                            <ul>
                                {preview.map((item, i) => {
                                    const offset = offsetOf(item)
                                    return (
                                        <li key={`${item.title}-${i}`}>
                                            <span className="apply-plan__preview-date">
                                                {offset == null ? '—' : formatDate(isoPlusDays(startDate, offset))}
                                            </span>
                                            <span className="apply-plan__preview-name">{item.title}</span>
                                            {(item.subtasks?.length || 0) > 0 && (
                                                <span className="apply-plan__preview-sub">
                                                    +{item.subtasks.length} подзадач
                                                </span>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                            {plan.length > preview.length && (
                                <div className="apply-plan__preview-more">
                                    и ещё {plan.length - preview.length}…
                                </div>
                            )}
                        </div>
                    )}

                    {error && <div className="apply-plan__error">{error}</div>}
                </div>
            )}
        </Modal>
    )
}
