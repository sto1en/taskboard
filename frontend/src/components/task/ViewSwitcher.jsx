import useT from '../../hooks/useT'
import { IconCalendar, IconCompact, IconKanban, IconList, IconPin } from '../common/ToolbarIcons'

const MODES = [
    { code: 'kanban',   Icon: IconKanban },
    { code: 'list',     Icon: IconList },
    { code: 'compact',  Icon: IconCompact },
    { code: 'calendar', Icon: IconCalendar },
]

/**
 * Переключатель вида проекта — сегментированный контрол.
 *
 * Раньше это был выпадающий список с одной непонятной иконкой: какие виды
 * вообще есть, приходилось узнавать наугад. Теперь все четыре режима видны
 * сразу, у каждого — подпись в tooltip и своя узнаваемая иконка.
 * Пин справа запоминает текущий вид (и сортировку) для проекта.
 */
export default function ViewSwitcher({
    mode,
    onChange,
    pinned = false,
    onTogglePin,
    saving = false,
}) {
    const t = useT()

    const label = (code) => {
        switch (code) {
            case 'kanban':   return t.viewKanban
            case 'list':     return t.viewList
            case 'compact':  return t.viewCompact
            case 'calendar': return t.viewCalendar
            default:         return code
        }
    }

    return (
        <div className="view-switcher" role="group" aria-label={t.viewProject}>
            <div className="view-switcher__segmented">
                {MODES.map(({ code, Icon }) => {
                    const active = code === mode
                    return (
                        <button
                            key={code}
                            type="button"
                            className={`view-switcher__option ${active ? 'view-switcher__option--active' : ''}`}
                            onClick={() => onChange(code)}
                            title={label(code)}
                            aria-label={label(code)}
                            aria-pressed={active}
                        >
                            <Icon />
                        </button>
                    )
                })}
            </div>

            <button
                type="button"
                className={`view-switcher__pin ${pinned ? 'view-switcher__pin--active' : ''}`}
                onClick={onTogglePin}
                disabled={!onTogglePin || saving}
                title={pinned ? t.unpinView : t.pinView}
                aria-label={pinned ? t.unpinView : t.pinView}
                aria-pressed={pinned}
            >
                <IconPin filled={pinned} size={15} />
            </button>
        </div>
    )
}
