// src/utils/sortTasks.js

function priorityValue(task) {
    const value = Number(task?.priority)
    return Number.isFinite(value) ? value : 0
}

function byPosition(a, b) {
    return (a.position || 0) - (b.position || 0)
}

/**
 * Сортировка задач для всех видов проекта (Kanban / Список / Компакт).
 *
 * Приоритет всегда идёт первым: чем выше приоритет, тем раньше задача.
 * Это правило действует во всех режимах, кроме «вручную» — в нём порядок
 * задаётся перетаскиванием (position), иначе drag&drop терял бы смысл.
 * Внутри одинакового приоритета работает выбранный критерий.
 */
export function sortTasks(tasks, sortMode, sortDir) {
    const dir = sortDir === 'desc' ? -1 : 1
    const arr = [...tasks]

    if (sortMode === 'manual' || !sortMode) {
        arr.sort((a, b) => dir * byPosition(a, b))
        return arr
    }

    let byMode
    switch (sortMode) {
        case 'by_status':
            byMode = (a, b) => {
                const ca = a.statusCategoryCode || ''
                const cb = b.statusCategoryCode || ''
                if (ca !== cb) return dir * ca.localeCompare(cb)
                const sa = a.statusCode || ''
                const sb = b.statusCode || ''
                return dir * sa.localeCompare(sb)
            }
            break
        case 'by_deadline':
            byMode = (a, b) => {
                if (!a.deadline && !b.deadline) return 0
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return dir * (new Date(a.deadline) - new Date(b.deadline))
            }
            break
        case 'by_created':
            byMode = (a, b) => dir * ((b.id || 0) - (a.id || 0))
            break
        case 'by_priority':
        default:
            // Приоритет уже учтён первым ключом — внутри уровня держим
            // ручной порядок, чтобы список не «прыгал».
            byMode = () => 0
    }

    arr.sort((a, b) => {
        // Приоритет: сначала высокий (2), затем обычный (0), затем низкий (-1).
        const byPriority = priorityValue(b) - priorityValue(a)
        if (byPriority !== 0) return byPriority
        return byMode(a, b) || byPosition(a, b)
    })

    return arr
}

// «Отменено» — крестик
export function isCancelled(task) {
    return task.statusCategoryCode === 'CANCELLED'
        || task.statusCode === 'CANCELLED'
}

// «Просрочено» — часики
export function isExpired(task) {
    return task.statusCategoryCode === 'EXPIRED'
        || task.statusCode === 'EXPIRED'
}

// «Выполнено» — галочка. CANCELLED / EXPIRED сюда не входят.
export function isDone(task) {
    if (isCancelled(task)) return false
    if (isExpired(task)) return false
    return task.statusCategoryCode === 'DONE'
        || task.statusCode === 'DONE'
        || task.statusCategoryCode === 'ARCHIVED'
}
