// frontend/src/components/layout/trees/PalmTree.jsx

/**
 * Пальма — гладкий изогнутый ствол с кольцами, веер из 7 перистых листьев.
 * Ветви листа идут от черешка; доли — единым путём, а не 200 штрихами.
 */

import { PALETTE, Ground, Trunk, Stage } from './kit'

const p = PALETTE.palm

/** Один перистый лист: черешок + две доли с «пилой» по краю. */
function Frond({ angle, len = 26, width = 7, tone = 'mid', origin = [50, 20], droop = 6 }) {
    const tones = {
        light: { fill: '#9ede66', dark: '#4f9a2e' },
        mid: { fill: '#6ec04a', dark: '#2f7a26' },
        deep: { fill: '#3f8b30', dark: '#1d5a17' },
    }
    const c = tones[tone] || tones.mid
    const rad = (angle * Math.PI) / 180
    const ex = origin[0] + Math.cos(rad) * len
    const ey = origin[1] + Math.sin(rad) * len + droop
    const mx = origin[0] + Math.cos(rad) * len * 0.55
    const my = origin[1] + Math.sin(rad) * len * 0.55 + droop * 0.28
    const nx = -Math.sin(rad) * width
    const ny = Math.cos(rad) * width

    // Пилообразный край доли: чередуем вершины по обе стороны от осевой.
    const teeth = 7
    let edgeA = ''
    let edgeB = ''
    for (let i = 1; i <= teeth; i++) {
        const t = i / (teeth + 1)
        const bx = origin[0] + (mx - origin[0]) * t * 1.9
        const by = origin[1] + (my - origin[1]) * t * 1.9 + droop * t * 0.5
        const k = 0.42 + t * 0.5
        edgeA += ` L${bx + nx * k} ${by + ny * k} L${bx + nx * 0.12} ${by + ny * 0.12}`
        edgeB += ` L${bx - nx * k} ${by - ny * k} L${bx - nx * 0.12} ${by - ny * 0.12}`
    }

    const dA = `M${origin[0]} ${origin[1]} Q${mx} ${my} ${ex} ${ey}${edgeA} Z`
    const dB = `M${origin[0]} ${origin[1]} Q${mx} ${my + 1} ${ex} ${ey}${edgeB} Z`

    return (
        <g>
            <path d={dB} fill={c.dark} opacity="0.92" />
            <path d={dA} fill={c.fill} />
            <path
                d={`M${origin[0]} ${origin[1]} Q${mx} ${my} ${ex} ${ey}`}
                stroke={c.dark}
                strokeWidth="0.55"
                fill="none"
                opacity="0.6"
            />
        </g>
    )
}

const FRONDS_YOUNG = [
    { angle: 200, len: 19, width: 5.5, tone: 'mid', droop: 3 },
    { angle: 340, len: 19, width: 5.5, tone: 'light', droop: 3 },
    { angle: 228, len: 15, width: 4.6, tone: 'deep', droop: 2 },
    { angle: 312, len: 15, width: 4.6, tone: 'mid', droop: 2 },
    { angle: 258, len: 18, width: 5, tone: 'light', droop: 1.5 },
    { angle: 282, len: 18, width: 5, tone: 'mid', droop: 1.5 },
]

const FRONDS_MATURE = [
    { angle: 197, len: 30, width: 8, tone: 'mid', droop: 8, origin: [50, 18] },
    { angle: 343, len: 30, width: 8, tone: 'light', droop: 8, origin: [50, 18] },
    { angle: 222, len: 25, width: 7, tone: 'deep', droop: 6, origin: [50, 17] },
    { angle: 318, len: 25, width: 7, tone: 'mid', droop: 6, origin: [50, 17] },
    { angle: 252, len: 26, width: 7, tone: 'light', droop: 4, origin: [50, 16] },
    { angle: 288, len: 26, width: 7, tone: 'mid', droop: 4, origin: [50, 16] },
    { angle: 270, len: 21, width: 6, tone: 'deep', droop: 2, origin: [50, 15] },
]

/** Кокосы в пазухе кроны. */
function Coconuts({ y = 22, s = 1 }) {
    return (
        <g>
            <circle cx={45.5} cy={y} r={3 * s} fill="#6b4a24" />
            <circle cx={44.4} cy={y - 1} r={1.1 * s} fill="#9a7442" opacity="0.8" />
            <circle cx={50.5} cy={y + 1.2} r={2.8 * s} fill="#5a3d1c" />
            <circle cx={49.6} cy={y + 0.4} r={1 * s} fill="#8a6738" opacity="0.8" />
            <circle cx={54.5} cy={y - 0.4} r={2.6 * s} fill="#77522a" />
            <circle cx={53.6} cy={y - 1.1} r={0.9 * s} fill="#a88046" opacity="0.8" />
        </g>
    )
}

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} dry />
            <Trunk d="M50 94 C49 86 51 78 50 70" width={3.4} bark={p.bark} />
            <ellipse cx="50" cy="86" rx="2.6" ry="0.6" fill={p.bark.dark} opacity="0.6" />
            <ellipse cx="50" cy="79" rx="2.6" ry="0.6" fill={p.bark.dark} opacity="0.6" />
            <g transform="translate(50 70) scale(0.52) translate(-50 -70)">
                {FRONDS_YOUNG.map((f, i) => <Frond key={i} {...f} origin={[50, 70]} />)}
            </g>
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={22} dry />
            <Trunk d="M50 94 C47 76 54 54 50 34" width={5} bark={p.bark} />
            {[86, 78, 70, 62, 54, 46, 40].map((y, i) => (
                <ellipse key={i} cx={i % 2 ? 49.4 : 50.6} cy={y} rx="3.1" ry="0.7" fill={p.bark.dark} opacity="0.55" />
            ))}
            {FRONDS_YOUNG.map((f, i) => <Frond key={i} {...f} origin={[50, 34]} />)}
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="26" ry="7" fill={p.shade} opacity="0.10" />
            <Ground rx={28} dry />
            <Trunk d="M50 96 C44 72 56 40 50 18" width={7.2} bark={p.bark} />
            {[90, 83, 76, 69, 62, 55, 48, 41, 34, 27].map((y, i) => (
                <ellipse
                    key={i}
                    cx={i % 2 ? 46.8 : 49.4}
                    cy={y}
                    rx={4}
                    ry="0.9"
                    fill={p.bark.dark}
                    opacity="0.5"
                    transform={`rotate(${i % 2 ? -5 : 5} ${50} ${y})`}
                />
            ))}
            {FRONDS_MATURE.map((f, i) => <Frond key={i} {...f} />)}
            <Coconuts y={22} s={1} />
        </Stage>
    )
}
