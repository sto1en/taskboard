import { formatSlot, plural } from './templateUtils'

/**
 * Карточка шаблона задач. Используется в «Моих шаблонах» и в каталоге
 * публичных шаблонов пользователей.
 *
 * Показываем только свои элементы управления: у чужих публичных шаблонов
 * нельзя ни открыть редактор, ни удалить — только применить или скопировать.
 */
export default function TemplateCard({
    template,
    onApply,
    onOpen,
    onDelete,
    onTogglePublic,
    onCopy,
    applying = false,
    visibilityBusy = false,
    showOwner = false,
}) {
    const tasks = template.items || []
    const itemCount = template.itemCount ?? tasks.length
    const subtaskCount = tasks.reduce((sum, i) => sum + (i.subtasks?.length || 0), 0)
    const mine = template.mine !== false

    return (
        <article className={`template-card template-card--${template.accent || 'blue'}`}>
            <div className="template-card__head">
                <span className="template-card__icon">{template.icon || '🧩'}</span>
                <div className="template-card__heading">
                    <h3 className="template-card__title">{template.title}</h3>
                    <div className="template-card__meta">
                        {itemCount} {plural(itemCount, ['задача', 'задачи', 'задач'])}
                        {subtaskCount > 0 && ` · ${subtaskCount} подзадач`}
                    </div>
                </div>
                {template.isPublic && (
                    <span className="template-card__public" title="Публичный шаблон">🌍</span>
                )}
            </div>

            {template.description && (
                <p className="template-card__desc">{template.description}</p>
            )}

            {tasks.length > 0 && (
                <ol className="template-card__tasks">
                    {tasks.slice(0, 4).map((item, i) => (
                        <li key={item.id || i}>
                            <span className="template-card__task-title">{item.title}</span>
                            <span className="template-card__deadline">
                                {formatSlot(item.deadlineOffsetDays)}
                            </span>
                        </li>
                    ))}
                    {tasks.length > 4 && (
                        <li className="template-card__more">и ещё {tasks.length - 4}…</li>
                    )}
                </ol>
            )}

            {showOwner && template.ownerUsername && (
                <div className="template-card__owner">
                    <span className="template-card__owner-avatar">
                        {template.ownerAvatarEmoji || '👤'}
                    </span>
                    <span>{template.ownerDisplayName || template.ownerUsername}</span>
                </div>
            )}

            <div className="template-card__actions">
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={onApply}
                    disabled={applying}
                >
                    Применить
                </button>

                {mine ? (
                    <>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onOpen}
                        >
                            Открыть
                        </button>
                        {onTogglePublic && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={onTogglePublic}
                                disabled={visibilityBusy}
                                title={template.isPublic
                                    ? 'Убрать из публичного каталога'
                                    : 'Опубликовать в каталоге'}
                            >
                                {visibilityBusy
                                    ? '…'
                                    : template.isPublic ? 'Скрыть' : '🌍 Опубликовать'}
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm template-card__delete"
                                onClick={onDelete}
                                title="Удалить шаблон"
                            >
                                Удалить
                            </button>
                        )}
                    </>
                ) : (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onCopy}
                        title="Создать свою копию"
                    >
                        Скопировать
                    </button>
                )}
            </div>
        </article>
    )
}
