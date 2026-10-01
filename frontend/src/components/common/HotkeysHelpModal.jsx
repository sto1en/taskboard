import Modal from '../Modal/Modal'

const GROUPS = [
    {
        title: 'Общие',
        items: [
            ['Esc', 'Назад'],
            ['Esc Esc', 'На главную (доски)'],
            ['H', 'Показать эту справку'],
            ['/ или Ctrl+K', 'Фокус в поиск'],
        ],
    },
    {
        title: 'Навигация',
        items: [
            ['1 / 2 / 3', 'Открыть 1-й / 2-й / 3-й закреп (вне проекта)'],
            ['G затем B', 'Перейти к доскам'],
            ['G затем C', 'Календарь'],
            ['G затем S', 'Статистика'],
            ['G затем P', 'Профиль'],
        ],
    },
    {
        title: 'Задачи (при наведении на карточку)',
        items: [
            ['E', 'Открыть задачу'],
            ['Space', 'Отметить как выполнено'],
            ['C', 'Дублировать задачу'],
            ['Delete', 'Отменить / вернуть в работу'],
            ['N', 'Новая задача'],
        ],
    },
    {
        title: 'Проект',
        items: [
            ['1', 'Таблица'],
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