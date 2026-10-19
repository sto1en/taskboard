// frontend/src/utils/shopSort.js
//
// Сортировка каталога магазина.
//
// Сервер умеет «популярность» (по числу покупок) и «цену», но не «по типу»:
// карточка с двумя типами (Апельсин = Плодовые + Экзотические) должна
// появиться ДВАЖДЫ — под каждой буквой. Поэтому список разворачивается на
// клиенте до пагинации, а не в SQL.

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true })

export function sortByPopularity(items) {
    const list = [...(items || [])]
    list.sort((a, b) => {
        const pa = a.purchaseCount || 0
        const pb = b.purchaseCount || 0
        if (pa !== pb) return pb - pa
        const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return cb - ca
    })
    return list
}

export function sortByPrice(items, dir = 'asc') {
    const list = [...(items || [])]
    list.sort((a, b) => (dir === 'desc'
        ? (b.price || 0) - (a.price || 0)
        : (a.price || 0) - (b.price || 0)))
    return list
}

/**
 * «По типу»: группируем по первой букве названия типа (кириллица/латиница —
 * порядок задаёт Intl.Collator), внутри буквы — по названию типа.
 * Предмет с типами A+B попадает в обе группы.
 *
 * miscTitle — подпись группы для предметов без типа («Прочее»/«Other»):
 * на русском она начинается с «П», на английском с «O», и попадает в разные
 * буквенные блоки — так и должно быть.
 */
export function expandByType(items, miscTitle = 'Прочее') {
    const groups = new Map()

    for (const item of items || []) {
        const cats = Array.isArray(item.categories) ? item.categories : []
        // У каждой карточки должен быть тип; если данных нет — показываем
        // её в группе «Прочее», чтобы товар не пропал из магазина.
        const list = cats.length > 0
            ? cats
            : [{ id: '__no-type', title: miscTitle, code: '__no-type' }]

        for (const cat of list) {
            const letter = (cat.title || '#').trim().charAt(0).toUpperCase() || '#'
            if (!groups.has(letter)) groups.set(letter, [])
            groups.get(letter).push({ item, group: cat })
        }
    }

    const letters = [...groups.keys()].sort(collator.compare)
    const result = []
    for (const letter of letters) {
        const bucket = groups.get(letter)
        bucket.sort((a, b) => collator.compare(a.group.title || '', b.group.title || ''))
        result.push(...bucket)
    }
    return result
}

/**
 * Единая точка: применяет режим сортировки и возвращает плоский массив
 * строк для рендера. key уникален: «по типу» намеренно дублирует карточки.
 */
export function prepareShopList(items, sortBy, sortDir, miscTitle) {
    const list = items || []

    if (sortBy === 'type') {
        return expandByType(list, miscTitle).map(({ item, group }) => ({
            item,
            key: `${item.id}::${group.id}`,
            groupTitle: group.title,
        }))
    }
    if (sortBy === 'price') {
        return sortByPrice(list, sortDir).map(item => ({ item, key: String(item.id) }))
    }
    if (sortBy === 'popular') {
        return sortByPopularity(list).map(item => ({ item, key: String(item.id) }))
    }
    // 'default' — как отдал сервер (sort_order).
    return list.map(item => ({ item, key: String(item.id) }))
}
