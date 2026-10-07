// src/utils/sortTasks.js

export function sortTasks(tasks, sortMode, sortDir) {
    const dir = sortDir === 'desc' ? -1 : 1
    const arr = [...tasks]

    switch (sortMode) {
        case 'by_status':
            arr.sort((a, b) => {
                const ca = a.statusCategoryCode || ''
                const cb = b.statusCategoryCode || ''
                if (ca !== cb) return dir * ca.localeCompare(cb)
                const sa = a.statusCode || ''
                const sb = b.statusCode || ''
                return dir * sa.localeCompare(sb)
            })
            break
        case 'by_priority':
            arr.sort((a, b) => dir * ((b.priority || 0) - (a.priority || 0)))
            break
        case 'by_deadline':
            arr.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return dir * (new Date(a.deadline) - new Date(b.deadline))
            })
            break
        case 'by_created':
            arr.sort((a, b) => dir * ((b.id || 0) - (a.id || 0)))
            break
        case 'manual':
        default:
            arr.sort((a, b) => dir * ((a.position || 0) - (b.position || 0)))
    }
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