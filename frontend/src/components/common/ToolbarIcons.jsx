/**
 * Небольшие SVG-иконки тулбара проекта.
 * Все рисуются currentColor, поэтому наследуют цвет кнопки.
 * size по умолчанию 16 — под высоту кнопок 38px.
 */

function Svg({ size = 16, className, children, filled = false }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke={filled ? 'none' : 'currentColor'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    )
}

export function IconKanban(props) {
    return (
        <Svg {...props}>
            <rect x="3" y="4" width="5" height="16" rx="1.6" />
            <rect x="9.5" y="4" width="5" height="10" rx="1.6" />
            <rect x="16" y="4" width="5" height="13" rx="1.6" />
        </Svg>
    )
}

export function IconList(props) {
    return (
        <Svg {...props}>
            <rect x="3.5" y="5" width="3" height="3" rx="0.8" />
            <rect x="3.5" y="10.5" width="3" height="3" rx="0.8" />
            <rect x="3.5" y="16" width="3" height="3" rx="0.8" />
            <path d="M10 6.5h10.5M10 12h10.5M10 17.5h10.5" />
        </Svg>
    )
}

export function IconCompact(props) {
    return (
        <Svg {...props}>
            <rect x="3" y="4.5" width="7.5" height="6" rx="1.4" />
            <rect x="13.5" y="4.5" width="7.5" height="6" rx="1.4" />
            <rect x="3" y="13.5" width="7.5" height="6" rx="1.4" />
            <rect x="13.5" y="13.5" width="7.5" height="6" rx="1.4" />
        </Svg>
    )
}

export function IconCalendar(props) {
    return (
        <Svg {...props}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M3.5 9.5h17M8 3v4M16 3v4" />
            <path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 16.8h.01M12 16.8h.01M16.5 16.8h.01" strokeWidth="2.2" />
        </Svg>
    )
}

export function IconSort(props) {
    return (
        <Svg {...props}>
            <path d="M7 4v16M4 17l3 3 3-3" />
            <path d="M17 20V4M14 7l3-3 3 3" />
        </Svg>
    )
}

export function IconArrowUp(props) {
    return (
        <Svg {...props}>
            <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </Svg>
    )
}

export function IconArrowDown(props) {
    return (
        <Svg {...props}>
            <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />
        </Svg>
    )
}

export function IconFilter(props) {
    return (
        <Svg {...props}>
            <path d="M3.5 5h17l-6.6 7.8v5.1l-3.8 2.1v-7.2L3.5 5Z" />
        </Svg>
    )
}

export function IconPin({ filled = false, ...props }) {
    return (
        <Svg {...props}>
            <path
                d="M9 3.5h6l-1.2 5.2 3.2 3.1H7l3.2-3.1L9 3.5Z"
                fill={filled ? 'currentColor' : 'none'}
            />
            <path d="M12 11.8V21" />
        </Svg>
    )
}

export function IconCheck(props) {
    return (
        <Svg {...props}>
            <path d="m5 12.5 4.5 4.5L19 7" />
        </Svg>
    )
}

export function IconChevronDown(props) {
    return (
        <Svg {...props}>
            <path d="m6 9.5 6 6 6-6" />
        </Svg>
    )
}

export function IconClose(props) {
    return (
        <Svg {...props}>
            <path d="M6 6l12 12M18 6 6 18" />
        </Svg>
    )
}
