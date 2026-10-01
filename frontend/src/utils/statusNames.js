// src/utils/statusNames.js
// Служебный маппинг: если бэкенд вернул русское название базового статуса,
// а язык пользователя — английский, показываем английский вариант.

const RU_TO_EN = {
    'В процессе': 'In Progress',
    'Выполнено': 'Done',
    'Просрочено': 'Overdue',
    'Отменено': 'Cancelled',
    'Отложено': 'Frozen',
    'Активный': 'Active',
    'Завершён': 'Done',
    'Отменён': 'Cancelled',
    'Новая задача': 'New task',
}

export function localizeStatusTitle(title, lang) {
    if (lang !== 'en' || !title) return title
    return RU_TO_EN[title] || title
}

export function localizeCategoryLabel(code, t) {
    switch (code) {
        case 'ACTIVE':    return t.categoryActive
        case 'FROZEN':    return t.categoryFrozen
        case 'DONE':      return t.categoryDone
        case 'EXPIRED':   return t.categoryExpired
        case 'CANCELLED': return t.categoryCancelled
        case 'ARCHIVED':  return t.categoryArchived
        default:          return code
    }
}