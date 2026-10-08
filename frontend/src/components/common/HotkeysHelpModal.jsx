import Modal from '../Modal/Modal'

const GROUPS = [
    {
        title: 'Общие',
        items: [
            ['Esc', 'Закрыть / назад'],
            ['H', 'Показать эту справку'],
            ['/ или Ctrl+K', 'Фокус в поиск'],
            ['T', 'Показать / скрыть дерево прогресса'],
        ],
    },
    {
        title: 'Создание',
        items: [
            ['N', 'Новая доска / проект / задача (зависит от страницы)'],
        ],
    },
    {
        title: 'Навигация',
        items: [
            ['G затем B', 'К доскам'],
            ['G затем C', 'К календарю'],
            ['G затем S', 'К статистике'],
            ['G затем P', 'К профилю'],
            ['1 / 2 / 3 (вне проекта)', 'Открыть 1-й / 2-й / 3-й закреп'],
        ],
    },
    {
        title: 'Задачи (при наведении на карточку)',
        items: [
            ['E', 'Открыть задачу'],
            ['Space', 'Отметить как выполненное / вернуть'],
            ['C', 'Дублировать задачу'],
            ['Delete', 'Удалить задачу'],
            ['Backspace', 'Перенести в отменённые / вернуть'],
        ],
    },
    {
        title: 'Вид проекта',
        items: [
            ['1', 'Таблица (Kanban)'],
            ['2', 'Список'],
            ['3', 'Компакт'],
            ['P', 'Режим перестановки'],
            ['Esc', 'Выйти из режима перестановки'],
        ],
    },
    {
        title: 'В редакторах',
        items: [
            ['Enter', 'Сохранить (однострочное поле)'],
            ['Ctrl+Enter', 'Сохранить (многострочное поле)'],
            ['Esc', 'Отменить редактирование'],
        ],
    },
]

export default function HotkeysHelpModal({ open, onClose }) {
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
                {GROUPS.map(g => (
                    <div key={g.title} className="hotkeys-help__group">
                        <div className="hotkeys-help__group-title">{g.title}</div>
                        {g.items.map(([combo, desc]) => (
                            <div key={combo} className="hotkeys-help__row">
                                <kbd className="hotkeys-help__kbd">{combo}</kbd>
                                <span className="hotkeys-help__desc">{desc}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </Modal>
    )
}