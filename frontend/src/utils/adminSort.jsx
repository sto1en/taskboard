/**
 * Меняет местами sortOrder двух соседних элементов.
 *
 * @param {Array} items — массив с .id и .sortOrder
 * @param {number} index — индекс текущего
 * @param {number} delta — -1 (вверх) или +1 (вниз)
 * @returns {Array|null} — [currentItem, neighborItem] или null, если сдвиг невозможен
 */
export function getSwapPair(items, index, delta) {
    const neighborIndex = index + delta
    if (neighborIndex < 0 || neighborIndex >= items.length) return null

    const current = items[index]
    const neighbor = items[neighborIndex]

    return [current, neighbor]
}

/**
 * Вычисляет новые sortOrder для пары.
 * Если у элементов одинаковый sortOrder — назначаем шаг 10.
 */
export function computeNewOrders(current, neighbor) {
    const a = current.sortOrder ?? 0
    const b = neighbor.sortOrder ?? 0

    // Если одинаковые — сдвигаем на 10
    if (a === b) {
        return {
            currentNew: b + 10,
            neighborNew: a,
        }
    }

    // Иначе — просто меняем местами
    return {
        currentNew: b,
        neighborNew: a,
    }
}