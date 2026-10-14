import { Aura, SparkleRing, seededRandom } from './common'

// Большой перистый лист (пальмовый)
function CoconutFrond({ x0, y0, x1, y1, tone = 'mid', side = 1, barbs = 14 }) {
    const palette = {
        light: { fill: '#8fc55e', vein: '#5e8f36', edge: '#4a7a28' },
        mid:   { fill: '#5a9f3a', vein: '#3a7520', edge: '#2c5f18' },
        deep:  { fill: '#3f7a2a', vein: '#265418', edge: '#1c4610' },
    }
    const c = palette[tone] || palette.mid
    const midX = (x0 + x1) / 2
    const midY = (y0 + y1) / 2 - 8
    const items = []
    // Основная ветка
    items.push(
        <path key="stem" d={`M${x0} ${y0} Q${midX} ${midY} ${x1} ${y1}`}
              stroke={c.vein} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    )
    // Мелкие перья вдоль
    for (let i = 1; i < barbs; i++) {
        const t = i / barbs
        const cx = x0 + (x1 - x0) * t + (midX - (x0 + x1) / 2) * (1 - Math.abs(2 * t - 1)) * 0.5
        const cy = y0 + (y1 - y0) * t + (midY - (y0 + y1) / 2) * (1 - Math.abs(2 * t - 1)) * 0.5
        const len = 4 + (1 - Math.abs(2 * t - 1)) * 4
        items.push(
            <path key={`a${i}`} d={`M${cx} ${cy} Q${cx + side * len * 0.6} ${cy - len * 0.4} ${cx + side * len} ${cy - len * 0.6}`}
                  stroke={c.fill} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.9"/>
        )
        items.push(
            <path key={`b${i}`} d={`M${cx} ${cy} Q${cx + side * len * 0.6} ${cy + len * 0.3} ${cx + side * len} ${cy + len * 0.5}`}
                  stroke={c.fill} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8"/>
        )
    }
    return <g>{items}</g>
}

// Кокос — коричневый овал с пятнами
function Coconut({ cx, cy, r = 3 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill="#5c3a1e"/>
            <ellipse cx={cx - r * 0.3} cy={cy - r * 0.3} rx={r * 0.35} ry={r * 0.3} fill="#7a5233" opacity="0.7"/>
            <ellipse cx={cx + r * 0.3} cy={cy + r * 0.3} rx={r * 0.25} ry={r * 0.2} fill="#3a2412" opacity="0.6"/>
            <circle cx={cx - r * 0.2} cy={cy - r * 0.4} r={r * 0.1} fill="#2f1d14"/>
        </g>
    )
}

// Крона — веер листьев на макушке
function CoconutCrown({ cx, cy, scale = 1 }) {
    const fronds = [
        { x1: cx - 32, y1: cy - 4,  tone: 'mid'   },
        { x1: cx + 32, y1: cy - 4,  tone: 'light' },
        { x1: cx - 24, y1: cy + 12, tone: 'deep'  },
        { x1: cx + 24, y1: cy + 12, tone: 'mid'   },
        { x1: cx - 20, y1: cy - 16, tone: 'light' },
        { x1: cx + 20, y1: cy - 16, tone: 'deep'  },
        { x1: cx - 10, y1: cy - 22, tone: 'mid'   },
        { x1: cx + 10, y1: cy - 22, tone: 'light' },
    ]
    return (
        <g>
            {fronds.map((f, i) => (
                <CoconutFrond key={i}
                              x0={cx} y0={cy}
                              x1={f.x1} y1={f.y1}
                              tone={f.tone}
                              side={f.x1 < cx ? 1 : -1}
                              barbs={14}/>
            ))}
        </g>
    )
}

// Высокий изогнутый ствол
function CoconutTrunk({ topY = 20, curve = 6 }) {
    // Ствол изогнут вправо
    const segments = []
    for (let i = 0; i < 14; i++) {
        const t = i / 13
        const y = 96 - t * (96 - topY)
        const x = 50 + Math.sin(t * 0.6) * curve
        segments.push({ x, y })
    }
    const pathD = `M${segments[0].x} ${segments[0].y} ` +
        segments.slice(1).map(s => `L${s.x} ${s.y}`).join(' ')

    return (
        <g>
            <path d={pathD}
                  stroke="#8a6b3d" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
            <path d={pathD}
                  stroke="#a88352" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* Кольца на стволе */}
            {segments.filter((_, i) => i % 2 === 0).map((s, i) => (
                <ellipse key={i} cx={s.x} cy={s.y} rx={2.6} ry={0.8}
                         fill="#5c4322" opacity="0.85"/>
            ))}
        </g>
    )
}

function CoconutGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="38" ry="4" fill="#c8a878" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="28" ry="2.6" fill="#e0c89a" opacity="0.9"/>
            <Coconut cx={22} cy={96} r={2.2}/>
            <Coconut cx={78} cy={96} r={2}/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CoconutGround />
            <path d="M50 94 C48 82 52 72 50 60" stroke="#8a6b3d" strokeWidth="3.6" strokeLinecap="round" fill="none"/>
            <ellipse cx={50} cy={88} rx={2.4} ry={0.7} fill="#5c4322" opacity="0.9"/>
            <ellipse cx={50} cy={78} rx={2.4} ry={0.7} fill="#5c4322" opacity="0.9"/>
            <ellipse cx={50} cy={68} rx={2.4} ry={0.7} fill="#5c4322" opacity="0.9"/>
            <CoconutCrown cx={50} cy={58} scale={0.55}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CoconutGround />
            <CoconutTrunk topY={34} curve={5}/>
            <CoconutCrown cx={53} cy={32} scale={0.9}/>
            {/* Несколько кокосов под кроной */}
            <Coconut cx={45} cy={40} r={2.4}/>
            <Coconut cx={57} cy={42} r={2.2}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="coconutAura" color1="#a8d97b" color2="#5a9f3a" />
            <circle cx="50" cy="45" r="46" fill="url(#coconutAura)" />
            <CoconutGround />
            <CoconutTrunk topY={18} curve={7}/>
            <CoconutCrown cx={56} cy={16} scale={1.25}/>

            {/* Много кокосов под кроной */}
            <Coconut cx={44} cy={26} r={2.6}/>
            <Coconut cx={52} cy={28} r={2.4}/>
            <Coconut cx={60} cy={26} r={2.2}/>
            <Coconut cx={48} cy={32} r={2.2}/>
            <Coconut cx={56} cy={34} r={2.4}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}