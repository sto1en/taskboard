// src/utils/sortTasks.js

export function sortTasks(tasks, sortMode, sortDir) {
    const dir = sortDir === 'desc' ? -1 : 1
    const arr = [...tasks]

    switch (sortMode) {
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

export function isDone(task) {
    return task.statusCategoryCode === 'DONE'
        || task.statusCode === 'DONE'
        || task.statusCategoryCode === 'CANCELLED'
}