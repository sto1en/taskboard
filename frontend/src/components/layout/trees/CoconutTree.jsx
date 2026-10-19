// frontend/src/components/layout/trees/CoconutTree.jsx

/**
 * Кокосовая пальма — выше и тоньше обычной, ствол с сильным изгибом,
 * а под кроной висят кокосы. Листья шире и «мясистее» пальмовых.
 */

import { PALETTE, Ground, Trunk, Stage } from './kit'

const p = PALETTE.coconut

function Frond({ angle, len = 26, width = 8, tone = 'mid', origin = [50, 20], droop = 7 }) {
    const tones = {
        light: { fill: '#8fd46c', dark: '#3f8b2c' },
        mid: { fill: '#5faa44', dark: '#2a701f' },
        deep: { fill: '#3c8a32', dark: '#1a5514' },
    }
    const c = tones[tone] || tones.mid
    const rad = (angle * Math.PI) / 180
    const ex = origin[0] + Math.cos(rad) * len
    const ey = origin[1] + Math.sin(rad) * len + droop
    const mx = origin[0] + Math.cos(rad) * len * 0.52
    const my = origin[1] + Math.sin(rad) * len * 0.52 + droop * 0.24
    const nx = -Math.sin(rad) * width
    const ny = Math.cos(rad) * width

    const teeth = 8
    let edgeA = ''
    let edgeB = ''
    for (let i = 1; i <= teeth; i++) {
        const t = i / (teeth + 1)
        const bx = origin[0] + (mx - origin[0]) * t * 1.9
        const by = origin[1] + (my - origin[1]) * t * 1.9 + droop * t * 0.55
        const k = 0.4 + t * 0.55
        edgeA += ` L${bx + nx * k} ${by + ny * k} L${bx + nx * 0.14} ${by + ny * 0.14}`
        edgeB += ` L${bx - nx * k} ${by - ny * k} L${bx - nx * 0.14} ${by - ny * 0.14}`
    }

    return (
        <g>
            <path d={`M${origin[0]} ${origin[1]} Q${mx} ${my + 1} ${ex} ${ey}${edgeB} Z`} fill={c.dark} opacity="0.92" />
            <path d={`M${origin[0]} ${origin[1]} Q${mx} ${my} ${ex} ${ey}${edgeA} Z`} fill={c.fill} />
            <path
                d={`M${origin[0]} ${origin[1]} Q${mx} ${my} ${ex} ${ey}`}
                stroke={c.dark}
                strokeWidth="0.5"
                fill="none"
                opacity="0.55"
            />
        </g>
    )
}

function Coconuts({ cx = 50, y = 24, s = 1 }) {
    const nuts = [
        { dx: -4.6, dy: 1.4, r: 3.1, fill: '#6b4a24', hi: '#a37c46' },
        { dx: 0.6, dy: 2.6, r: 2.9, fill: '#5a3d1c', hi: '#8f6c3c' },
        { dx: 4.4, dy: 1, r: 2.7, fill: '#7c5628', hi: '#b08a4e' },
    ]
    return (
        <g>
            {nuts.map((n, i) => (
                <g key={i}>
                    <circle cx={cx + n.dx * s} cy={y + n.dy * s} r={n.r * s} fill={n.fill} />
                    <circle cx={cx + n.dx * s - n.r * s * 0.32} cy={y + n.dy * s - n.r * s * 0.34} r={n.r * s * 0.3} fill={n.hi} opacity="0.7" />
                </g>
            ))}
        </g>
    )
}

const FRONDS_SMALL = [
    { angle: 205, len: 18, width: 6, tone: 'mid', droop: 3 },
    { angle: 335, len: 18, width: 6, tone: 'light', droop: 3 },
    { angle: 235, len: 14, width: 5, tone: 'deep', droop: 2 },
    { angle: 305, len: 14, width: 5, tone: 'mid', droop: 2 },
    { angle: 270, len: 17, width: 5.5, tone: 'light', droop: 1 },
]

const FRONDS_MATURE = [
    { angle: 200, len: 31, width: 9, tone: 'mid', droop: 9, origin: [55, 21] },
    { angle: 340, len: 31, width: 9, tone: 'light', droop: 9, origin: [55, 21] },
    { angle: 224, len: 26, width: 8, tone: 'deep', droop: 7, origin: [55, 20] },
    { angle: 316, len: 26, width: 8, tone: 'mid', droop: 7, origin: [55, 20] },
    { angle: 250, len: 27, width: 7.5, tone: 'light', droop: 5, origin: [55, 19] },
    { angle: 290, len: 27, width: 7.5, tone: 'mid', droop: 5, origin: [55, 19] },
    { angle: 272, len: 22, width: 6.5, tone: 'deep', droop: 3, origin: [55, 18] },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={16} dry />
            <Trunk d="M50 94 C50 87 52 80 51 72" width={3.2} bark={p.bark} />
            <ellipse cx="51" cy="86" rx="2.4" ry="0.6" fill={p.bark.dark} opacity="0.55" />
            <g transform="translate(51 72) scale(0.5) translate(-51 -72)">
                {FRONDS_SMALL.map((f, i) => <Frond key={i} {...f} origin={[51, 72]} />)}
            </g>
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={21} dry />
            <Trunk d="M50 94 C48 78 55 56 52 36" width={4.8} bark={p.bark} />
            {[87, 79, 71, 63, 55, 47, 41].map((y, i) => (
                <ellipse key={i} cx={i % 2 ? 51 : 52} cy={y} rx="3" ry="0.7" fill={p.bark.dark} opacity="0.5" />
            ))}
            {FRONDS_SMALL.map((f, i) => <Frond key={i} {...f} origin={[52, 36]} />)}
            <Coconuts cx={52} y={39} s={0.7} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="52" cy="88" rx="25" ry="7" fill={p.shade} opacity="0.10" />
            <Ground rx={27} dry />
            <Trunk d="M50 96 C45 74 58 44 55 21" width={6.6} bark={p.bark} />
            {[90, 84, 78, 72, 66, 60, 54, 48, 42, 36, 30, 25].map((y, i) => (
                <ellipse
                    key={i}
                    cx={48 + i * 0.55}
                    cy={y}
                    rx={3.7}
                    ry="0.85"
                    fill={p.bark.dark}
                    opacity="0.48"
                    transform={`rotate(${i % 2 ? -6 : 6} ${48 + i * 0.55} ${y})`}
                />
            ))}
            {FRONDS_MATURE.map((f, i) => <Frond key={i} {...f} />)}
            <Coconuts cx={55} y={24} s={1} />
        </Stage>
    )
}
