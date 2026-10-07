export default function TaskBoardLogo({ size = 32 }) {
    return (
        <span
            className="taskboard-logo"
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 64 64"
                width="100%"
                height="100%"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="tbGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"  stopColor="#4c9aff" />
                        <stop offset="100%" stopColor="#8f6ed5" />
                    </linearGradient>
                </defs>
                <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#tbGrad)" />
                <text
                    x="32" y="42"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="800"
                    fontSize="30"
                    fill="#fff"
                >
                    T
                </text>
            </svg>
        </span>
    )
}