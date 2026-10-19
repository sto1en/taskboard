// frontend/src/components/layout/trees/WillowTree.jsx

/**
 * Ива — плакучая крона: высокий ствол, купол наверху и «струи» ветвей,
 * свисающие почти до земли. У взрослой ивы струи доходят до травы.
 */

import { PALETTE, Ground, Crown, Texture, Trunk, Branches, Stage } from './kit'
import { seededRandom } from './common'

const p = PALETTE.willow

/**
 * Одна «коса» — цепочка листьев вдоль провисающей ветви.
 * Рисуем кривой безье, точки берём по параметру t.
 */
function Strand({ from, control, to, seed = 1, leaves = 8, size = 1.5, sway = 1 }) {
    const items = []
    for (let i = 0; i < leaves; i++) {
        const t = (i + 0.5) / leaves
        const mt = 1 - t
        const x = mt * mt * from[0] + 2 * mt * t * control[0] + t * t * to[0]
        const y = mt * mt * from[1] + 2 * mt * t * control[1] + t * t * to[1]
        const dx = (seededRandom(seed, i) - 0.5) * sway
        const s = size * (0.7 + seededRandom(seed, i + 11) * 0.55)
        items.push(
            <ellipse
                key={i}
                cx={Math.round((x + dx) * 10) / 10}
                cy={Math.round(y * 10) / 10}
                rx={s}
                ry={s * 0.55}
                transform={`rotate(${Math.round(seededRandom(seed, i + 21) * 80 - 40)} ${x} ${y})`}
                fill={i % 3 === 0 ? p.shade : i % 3 === 1 ? p.fill : p.hi}
                opacity={0.9}
            />,
        )
    }
    return (
        <g>
            <path
                d={`M${from[0]} ${from[1]} Q${control[0]} ${control[1]} ${to[0]} ${to[1]}`}
                stroke="#5c7a35"
                strokeWidth="0.7"
                fill="none"
                opacity="0.75"
            />
            {items}
        </g>
    )
}

function Curtain({ strands }) {
    return <g>{strands.map((s, i) => <Strand key={i} {...s} seed={s.seed || i + 1} />)}</g>
}

const MATURE_STRANDS = [
    { from: [18, 40], control: [10, 62], to: [22, 84], leaves: 9, size: 1.7, seed: 1 },
    { from: [24, 36], control: [18, 66], to: [30, 90], leaves: 10, size: 1.8, seed: 2 },
    { from: [32, 30], control: [29, 64], to: [39, 88], leaves: 10, size: 1.7, seed: 3 },
    { from: [40, 26], control: [39, 62], to: [47, 86], leaves: 9, size: 1.6, seed: 4 },
    { from: [50, 24], control: [51, 60], to: [53, 84], leaves: 9, size: 1.6, seed: 5 },
    { from: [60, 26], control: [61, 62], to: [59, 86], leaves: 9, size: 1.6, seed: 6 },
    { from: [68, 30], control: [71, 64], to: [65, 88], leaves: 10, size: 1.7, seed: 7 },
    { from: [76, 36], control: [82, 66], to: [72, 90], leaves: 10, size: 1.8, seed: 8 },
    { from: [82, 40], control: [90, 62], to: [78, 84], leaves: 9, size: 1.7, seed: 9 },
]

const YOUNG_STRANDS = [
    { from: [32, 40], control: [28, 54], to: [36, 68], leaves: 7, size: 1.5, seed: 11 },
    { from: [42, 36], control: [40, 56], to: [47, 72], leaves: 7, size: 1.5, seed: 12 },
    { from: [52, 36], control: [52, 56], to: [53, 72], leaves: 7, size: 1.5, seed: 13 },
    { from: [62, 38], control: [64, 56], to: [60, 70], leaves: 7, size: 1.5, seed: 14 },
    { from: [70, 42], control: [74, 54], to: [66, 68], leaves: 6, size: 1.4, seed: 15 },
]

const MATURE_BLOBS = [
    { cx: 50, cy: 30, rx: 30, ry: 16 },
    { cx: 28, cy: 34, rx: 15, ry: 11 },
    { cx: 72, cy: 34, rx: 15, ry: 11 },
    { cx: 50, cy: 22, rx: 20, ry: 10 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 32, rx: 19, ry: 12 },
    { cx: 34, cy: 36, rx: 10, ry: 8 },
    { cx: 66, cy: 36, rx: 10, ry: 8 },
    { cx: 50, cy: 24, rx: 13, ry: 8 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={18} tone="#7fa353" />
            <path d="M50 94 C48 86 52 79 50 71" stroke={p.bark.base} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M50 83 C45 80 42 76 41 72" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <path d="M50 80 C55 77 58 73 59 69" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={10}
                shadow={0.2}
                gloss={0.3}
                depth={2}
                blobs={[
                    { cx: 42, cy: 68, rx: 7, ry: 4.6 },
                    { cx: 58, cy: 66, rx: 7, ry: 4.6 },
                    { cx: 50, cy: 62, rx: 8, ry: 5 },
                ]}
            />
            <Curtain
                strands={[
                    { from: [43, 66], control: [40, 74], to: [44, 82], leaves: 4, size: 1.2, seed: 30 },
                    { from: [58, 64], control: [61, 72], to: [57, 80], leaves: 4, size: 1.2, seed: 31 },
                ]}
            />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={23} tone="#7fa353" />
            <Trunk d="M50 94 C48 78 52 58 50 40" width={4.6} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.2}
                ds={['M50 62 C44 58 39 52 37 44', 'M50 58 C57 54 61 48 63 42', 'M50 48 C47 44 45 39 45 34']}
            />
            <Crown p={p} seed={22} blobs={YOUNG_BLOBS} shadow={0.24} gloss={0.28} />
            <Texture p={p} seed={32} count={16} size={1.2} area={{ cx: 50, cy: 32, rx: 19, ry: 13 }} />
            <Curtain strands={YOUNG_STRANDS} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="36" ry="9" fill={p.shade} opacity="0.10" />
            <Ground rx={31} tone="#7fa353" />
            <Trunk d="M50 96 C46 76 55 48 50 24" width={8} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={3.2}
                ds={[
                    'M50 66 C38 62 26 52 20 40',
                    'M52 60 C64 54 74 44 80 32',
                    'M50 46 C42 40 34 32 30 24',
                    'M50 40 C58 34 66 26 70 18',
                ]}
            />
            <Crown p={p} seed={112} blobs={MATURE_BLOBS} shadow={0.26} gloss={0.28} depth={3} />
            <Texture p={p} seed={132} count={26} size={1.4} area={{ cx: 50, cy: 28, rx: 31, ry: 17 }} />
            <Curtain strands={MATURE_STRANDS} />
        </Stage>
    )
}
