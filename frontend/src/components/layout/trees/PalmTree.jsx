import { SparkleRing } from './common'

function PalmLeaf({ x0, y0, x1, y1, x2, y2, side = 1, tone = 'mid' }) {
    const colors = { light: '#c4e07a', mid: '#7cba3c', deep: '#3e7a1e' }
    const c = colors[tone] || colors.mid
    const midX = (x0 + x1) / 2
    const midY = (y0 + y1) / 2
    const barbs = []
    for (let i = 1; i <= 6; i++) {
        const t = i / 7
        const cx = x0 + (x1 - x0) * t
        const cy = y0 + (y1 - y0) * t
        barbs.push(<line key={`a${i}`} x1={cx} y1={cy} x2={cx + side * 3} y2={cy - 2}
                         stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.9"/>)
        barbs.push(<line key={`b${i}`} x1={cx} y1={cy} x2={cx + side * 3} y2={cy + 2}
                         stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.75"/>)
    }
    return (
        <g>
            <path d={`M${x0} ${y0} Q${midX} ${midY} ${x1} ${y1} Q${x2} ${y2} ${x0} ${y0}`}
                  fill={c} opacity="0.85"/>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
            {barbs}
        </g>
    )
}

function PalmCrown({ cx, cy, scale = 1 }) {
    return (
        <g>
            <PalmLeaf x0={cx} y0={cy} x1={cx - 30 * scale} y1={cy - 4 * scale} x2={cx - 25 * scale} y2={cy + 4 * scale} side={1} tone="mid"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx + 30 * scale} y1={cy - 4 * scale} x2={cx + 25 * scale} y2={cy + 4 * scale} side={-1} tone="light"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx - 20 * scale} y1={cy - 18 * scale} x2={cx - 14 * scale} y2={cy - 9 * scale} side={1} tone="deep"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx + 20 * scale} y1={cy - 18 * scale} x2={cx + 14 * scale} y2={cy - 9 * scale} side={-1} tone="mid"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx - 14 * scale} y1={cy + 14 * scale} x2={cx - 7 * scale} y2={cy + 7 * scale} side={1} tone="light"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx + 14 * scale} y1={cy + 14 * scale} x2={cx + 7 * scale} y2={cy + 7 * scale} side={-1} tone="deep"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx - 7 * scale} y1={cy - 24 * scale} x2={cx} y2={cy - 13 * scale} side={1} tone="mid"/>
            <PalmLeaf x0={cx} y0={cy} x1={cx + 7 * scale} y1={cy - 24 * scale} x2={cx} y2={cy - 13 * scale} side={-1} tone="light"/>
        </g>
    )
}

function PalmTrunk({ d, segments }) {
    return (
        <g>
            <path d={d} stroke="#8a6b3d" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <path d={d} stroke="#6b4e28" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5"/>
            {segments.map((p, i) => (
                <ellipse key={i} cx={p[0]} cy={p[1]} rx={p[2] || 3.2} ry={p[3] || 0.9}
                         fill="#5c4322" opacity="0.9"
                         transform={p[4] ? `rotate(${p[4]} ${p[0]} ${p[1]})` : ''}/>
            ))}
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="94" rx="18" ry="3" fill="#b8a06a" opacity="0.85"/>
            <ellipse cx="50" cy="93" rx="14" ry="2" fill="#d4bc85" opacity="0.8"/>
            <path d="M50 94 C48 82 52 74 50 60" stroke="#8a6b3d" strokeWidth="3.6" strokeLinecap="round" fill="none"/>
            <ellipse cx="50" cy="88" rx="3" ry="0.8" fill="#5c4322" opacity="0.9"/>
            <ellipse cx="50" cy="80" rx="3" ry="0.8" fill="#5c4322" opacity="0.9"/>
            <ellipse cx="50" cy="70" rx="3" ry="0.8" fill="#5c4322" opacity="0.9"/>
            <PalmCrown cx={50} cy={58} scale={0.5}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="95" rx="26" ry="3.5" fill="#b8a06a" opacity="0.9"/>
            <ellipse cx="50" cy="94" rx="20" ry="2.2" fill="#d4bc85" opacity="0.8"/>
            {/* ствол чуть наклонён, но уже высокий */}
            <PalmTrunk
                d="M50 94 C48 76 54 56 50 34"
                segments={[
                    [50, 86, 3.2, 0.9, 5],
                    [49, 78, 3.2, 0.9, -4],
                    [51, 70, 3.2, 0.9, 6],
                    [50, 62, 3.2, 0.9, -6],
                    [51, 54, 3.2, 0.9, 4],
                    [50, 46, 3.2, 0.9, -5],
                    [50, 38, 3.2, 0.9, 3],
                ]}
            />
            <PalmCrown cx={50} cy={34} scale={0.9}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="96" rx="38" ry="4" fill="#b8a06a" opacity="0.9"/>
            <ellipse cx="50" cy="95" rx="30" ry="2.5" fill="#d4bc85" opacity="0.8"/>
            {/* ствол высокий, чуть изогнут */}
            <PalmTrunk
                d="M50 96 C46 76 56 50 50 20"
                segments={[
                    [50, 90, 4.2, 1.1, 6],
                    [48, 84, 4.2, 1.1, -5],
                    [51, 78, 4.2, 1.1, 7],
                    [49, 72, 4.2, 1.1, -7],
                    [52, 66, 4.2, 1.1, 5],
                    [50, 60, 4.2, 1.1, -6],
                    [51, 54, 4.2, 1.1, 8],
                    [50, 48, 4.2, 1.1, -4],
                    [50, 42, 4.2, 1.1, 5],
                    [50, 36, 4.2, 1.1, -3],
                    [50, 28, 4.2, 1.1, 4],
                ]}
            />
            <PalmCrown cx={50} cy={20} scale={1.25}/>
            <SparkleRing colorScheme="green" />
        </svg>
    )
}