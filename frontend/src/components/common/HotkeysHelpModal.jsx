import { useLocation } from 'react-router-dom'
import Modal from '../modal/Modal'

// k('клавиши', 'описание')
const k = (combo, desc) => ({ combo, desc })

// Группа = категория + два уровня: обычные и для продвинутых.
const group = (title, basic = [], advanced = []) => ({ title, basic, advanced })

const NAV_BASIC = [
    k('Esc', 'Закрыть окно / вернуться назад'),
    k('/', 'Фокус в поиск'),
]

const navAdvanced = (withPins) => [
    ...(withPins ? [k('1 / 2 / 3', 'Открыть 1-й / 2-й / 3-й закреплённый проект')] : []),
    k('G, затем B', 'Перейти к доскам'),
    k('G, затем C', 'Перейти к календарю'),
    k('G, затем S', 'Перейти к статистике'),
    k('G, затем P', 'Перейти к профилю'),
    k('Ctrl+K', 'Поиск (работает даже из поля ввода)'),
]

const uiAdvanced = [
    k('T', 'Показать / скрыть дерево прогресса'),
    k('H', 'Открыть эту справку'),
]

const navigation = (withPins = true) => group('Навигация', NAV_BASIC, navAdvanced(withPins))
const ui = () => group('Интерфейс', [], uiAdvanced)

// Категории конкретных страниц
const PROJECT_GROUPS = [
    group('Задачи (курсор на карточке)', [
        k('N', 'Новая задача'),
        k('E', 'Открыть задачу'),
        k('Space', 'Выполнить / вернуть задачу'),
    ], [
        k('C', 'Дублировать задачу'),
        k('Ctrl+C', 'Дублировать задачу'),
        k('Delete', 'Удалить задачу'),
        k('Backspace', 'Перенести в отменённые / вернуть'),
    ]),
    group('Виды задач', [
        k('1', 'Таблица (Kanban)'),
        k('2', 'Список'),
        k('3', 'Компакт'),
    ], [
        k('P', 'Режим перестановки'),
        k('Esc', 'Выйти из режима перестановки'),
    ]),
    group('Редакторы', [], [
        k('Enter', 'Сохранить однострочное поле'),
        k('Ctrl+Enter', 'Сохранить многострочное поле'),
        k('Esc', 'Отменить редактирование'),
    ]),
]

const CALENDAR_GROUPS = [
    group('Календарь', [
        k('← / →', 'Предыдущий / следующий месяц'),
        k('N', 'Новая задача на выбранный день'),
    ], [
        k('Space', 'Выполнить / вернуть задачу под курсором'),
        k('E', 'Открыть задачу под курсором'),
        k('Delete', 'Удалить задачу под курсором'),
        k('Backspace', 'Перенести в отменённые / вернуть'),
    ]),
    group('Модалка дня', [], [
        k('Space', 'Выполнить / вернуть задачу под курсором'),
        k('E', 'Открыть задачу под курсором'),
        k('Delete', 'Удалить задачу'),
        k('Backspace', 'Перенести в отменённые / вернуть'),
    ]),
]

const BOARDS_GROUPS = [
    group('Доски', [
        k('N', 'Новая доска'),
    ]),
]

const BOARD_GROUPS = [
    group('Доска', [
        k('N', 'Новый проект'),
    ]),
]

function resolvePage(pathname) {
    if (pathname === '/') return { title: 'Главная', groups: [] }
    if (pathname.startsWith('/calendar')) return { title: 'Календарь', groups: CALENDAR_GROUPS }
    if (/^\/boards\/\d+\/projects\/\d+\/search/.test(pathname)) {
        return { title: 'Поиск по проекту', groups: [], insideProject: true }
    }
    if (/^\/boards\/\d+\/projects\/\d+/.test(pathname)) {
        return { title: 'Проект', groups: PROJECT_GROUPS, insideProject: true }
    }
    if (/^\/boards\/\d+\/settings/.test(pathname)) {
        return { title: 'Настройки доски', groups: [] }
    }
    if (/^\/boards\/\d+/.test(pathname)) return { title: 'Доска', groups: BOARD_GROUPS }
    if (pathname.startsWith('/boards')) return { title: 'Доски', groups: BOARDS_GROUPS }
    if (pathname.startsWith('/stats')) return { title: 'Статистика', groups: [] }
    if (pathname.startsWith('/shop')) return { title: 'Магазин', groups: [] }
    if (pathname.startsWith('/profile')) return { title: 'Профиль', groups: [] }
    if (pathname.startsWith('/settings')) return { title: 'Настройки', groups: [] }
    if (pathname.startsWith('/search')) return { title: 'Поиск', groups: [] }
    if (pathname.startsWith('/help')) return { title: 'Помощь', groups: [] }
    if (pathname.startsWith('/admin')) return { title: 'Админ-панель', groups: [] }
    return { title: 'Главная', groups: [] }
}

function buildGroups(page) {
    // На странице проекта глобальные 1/2/3 заняты переключением видов,
    // поэтому закреплённые проекты там недоступны.
    const withPins = !page.insideProject
    return [...page.groups, navigation(withPins), ui()]
}

export default function HotkeysHelpModal({ open, onClose }) {
    const { pathname } = useLocation()
    const page = resolvePage(pathname)
    const groups = buildGroups(page)

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Горячие клавиши"
            footer={
                <button className="btn btn-ghost" onClick={onClose}>
                    Закрыть
                </button>
            }
        >
            <div className="hotkeys-help">
                <div className="hotkeys-help__page">
                    <span className="hotkeys-help__page-label">Страница:</span>
                    <span className="hotkeys-help__page-name">{page.title}</span>
                </div>

                {groups.map(g => (
                    <section key={g.title} className="hotkeys-help__group">
                        <div className="hotkeys-help__group-title">{g.title}</div>

                        {g.basic.length > 0 && (
                            <div className="hotkeys-help__level">
                                <div className="hotkeys-help__level-title">Обычные</div>
                                {g.basic.map(item => (
                                    <div key={`${g.title}-b-${item.combo}`} className="hotkeys-help__row">
                                        <kbd className="hotkeys-help__kbd">{item.combo}</kbd>
                                        <span className="hotkeys-help__desc">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {g.advanced.length > 0 && (
                            <div className="hotkeys-help__level">
                                <div className="hotkeys-help__level-title hotkeys-help__level-title--advanced">
                                    Для продвинутых
                                </div>
                                {g.advanced.map(item => (
                                    <div key={`${g.title}-a-${item.combo}`} className="hotkeys-help__row">
                                        <kbd className="hotkeys-help__kbd">{item.combo}</kbd>
                                        <span className="hotkeys-help__desc">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </Modal>
    )
}
