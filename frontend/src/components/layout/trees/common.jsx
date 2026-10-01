// Общие утилиты и SVG-компоненты для деревьев.

export function seededRandom(seed, i) {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280
    return x - Math.floor(x)
}

export function Sparkle({ cx, cy, r = 1.6, rot = 0, fill = '#ffe9a8', stroke = '#f4b942' }) {
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.9">
            <path
                d={`M${cx} ${cy - r * 2} L${cx + r * 0.4} ${cy - r * 0.4} L${cx + r * 2} ${cy}
                    L${cx + r * 0.4} ${cy + r * 0.4} L${cx} ${cy + r * 2}
                    L${cx - r * 0.4} ${cy + r * 0.4} L${cx - r * 2} ${cy}
                    L${cx - r * 0.4} ${cy - r * 0.4} Z`}
                fill={fill}
                stroke={stroke}
                strokeWidth={r * 0.15}
            />
        </g>
    )
}

export function SparkleRing({ colorScheme = 'yellow' }) {
    const palette = {
        yellow: { fill: '#ffe9a8', stroke: '#f4b942' },
        pink:   { fill: '#ffd3e6', stroke: '#d34f8c' },
        green:  { fill: '#e8f5c8', stroke: '#a8d97b' },
    }[colorScheme] || { fill: '#ffe9a8', stroke: '#f4b942' }

    return (
        <g>
            <Sparkle cx={14} cy={30} r={1.6} rot={20}  {...palette} />
            <Sparkle cx={86} cy={22} r={1.4} rot={-15} {...palette} />
            <Sparkle cx={30} cy={12} r={1.8} rot={45}  {...palette} />
            <Sparkle cx={70} cy={10} r={1.5} rot={-30} {...palette} />
            <Sparkle cx={10} cy={50} r={1.3} rot={10}  {...palette} />
            <Sparkle cx={92} cy={44} r={1.3} rot={-40} {...palette} />
            <Sparkle cx={50} cy={6}  r={1.6} rot={0}   {...palette} />
        </g>
    )
}

export function Aura({ id, color1, color2 }) {
    return (
        <defs>
            <radialGradient id={id} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={color1} stopOpacity="0.32" />
                <stop offset="60%"  stopColor={color2} stopOpacity="0.14" />
                <stop offset="100%" stopColor={color2} stopOpacity="0" />
            </radialGradient>
        </defs>
    )
}