// frontend/src/components/layout/trees/CypressTree.jsx

/**
 * Кипарис — узкая «веретенообразная» крона почти от земли до макушки.
 * Ключ к сходству: силуэт — вытянутая капля, а не шар; ветви не видны.
 */

import { PALETTE, Ground, Texture, Trunk, Stage } from './kit'
import { seededRandom } from './common'
import { blob, ringPoints } from './kit'

const p = PALETTE.cypress

/**
 * Веретено: тело из трёх капель разной ширины и «щитки» чешуйчатых листьев.
 */
function Spindle({ h, w, cy, seed = 1, scale = 1 }) {
    const blobs = [
        { cx: 50, cy: cy + h * 0.32, rx: w * 0.42, ry: h * 0.3 },
        { cx: 50, cy, rx: w, ry: h * 0.5 },
        { cx: 50, cy: cy - h * 0.42, rx: w * 0.62, ry: h * 0.34 },
    ]

    const scales = []
    const n = 22
    for (let i = 0; i < n; i++) {
        const t = i / n
        const y = cy - h * 0.62 + h * 1.24 * t
        const halfW = w * (0.95 - Math.abs(t - 0.42) * 1.1)
        const x = 50 + (seededRandom(seed, i) - 0.5) * halfW * 1.4
        const s = (1.2 + seededRandom(seed, i + 37) * 1.1) * scale
        scales.push(
            <ellipse
                key={i}
                cx={Math.round(x * 10) / 10}
                cy={Math.round(y * 10) / 10}
                rx={s}
                ry={s * 0.7}
                transform={`rotate(${Math.round(seededRandom(seed, i + 61) * 70 - 35)} ${x} ${y})`}
                fill={seededRandom(seed, i + 91) > 0.5 ? p.shade : p.hi}
                opacity="0.4"
            />,
        )
    }

    return (
        <g>
            <path
                d={`${blob(50, cy + h * 0.34, w * 0.44, h * 0.3, seed + 1)}
                    ${blob(50, cy, w, h * 0.5, seed + 2)}
                    ${blob(50, cy - h * 0.44, w * 0.66, h * 0.34, seed + 3)}`}
                fill={p.shade}
                opacity="0.3"
                transform="translate(1.4 1.6)"
            />
            <path
                d={`${blob(50, cy + h * 0.32, w * 0.43, h * 0.31, seed + 4)}
                    ${blob(50, cy, w * 0.98, h * 0.5, seed + 5)}
                    ${blob(50, cy - h * 0.42, w * 0.62, h * 0.35, seed + 6)}`}
                fill={p.fill}
            />
            {/* Светлая грань слева — крона выглядит цилиндром, а не плоскостью */}
            <path
                d={`${blob(47, cy + h * 0.28, w * 0.26, h * 0.3, seed + 7)}
                    ${blob(47, cy - h * 0.02, w * 0.5, h * 0.46, seed + 8)}`}
                fill={p.hi}
                opacity="0.24"
            />
            {scales}
        </g>
    )
}

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={15} tone="#5f8a3e" />
            <path d="M50 94 C50 88 50.5 82 50 76" stroke={p.bark.base} strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <Spindle h={22} w={5} cy={64} seed={3} scale={0.62} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={20} tone="#5f8a3e" />
            <Trunk d="M50 94 C50 86 50 80 50 74" width={3.4} bark={p.bark} />
            <Spindle h={52} w={11} cy={50} seed={13} scale={0.9} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="90" rx="22" ry="6" fill={p.shade} opacity="0.14" />
            <Ground rx={24} tone="#5f8a3e" />
            <Trunk d="M50 96 L50 88" width={5} bark={p.bark} />
            <Spindle h={80} w={17} cy={50} seed={23} scale={1} />
            <Texture p={p} seed={33} count={16} size={1.1} area={{ cx: 50, cy: 50, rx: 14, ry: 36 }} opacity={0.28} />
            <g opacity="0.55">
                {ringPoints(50, 50, 12, 34, 14, 9).slice(0, 6).map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="0.9" fill={p.hi} />
                ))}
            </g>
        </Stage>
    )
}
