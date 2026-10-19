// frontend/src/components/layout/trees/EucalyptusTree.jsx

/**
 * Эвкалипт — высокий и «голый»: крона сдвинута в верхнюю треть,
 * ствол светлый с длинными отслаивающимися полосами коры,
 * листья сизоватые, серповидные, редко посажены.
 */

import { PALETTE, Ground, Crown, Texture, Trunk, Branches, Stage } from './kit'
import { seededRandom } from './common'

const p = PALETTE.eucalyptus

/** Серповидный лист: дуга + заливка, торчит из ветви. */
function Sickle({ x, y, len = 8, rot = 0, curl = 0.45, fill = '#8fa9a3' }) {
    const rad = (rot * Math.PI) / 180
    const ex = x + Math.cos(rad) * len
    const ey = y + Math.sin(rad) * len
    const cx = x + Math.cos(rad + curl) * len * 0.6
    const cy = y + Math.sin(rad + curl) * len * 0.6
    const nx = -Math.sin(rad) * 1.6
    const ny = Math.cos(rad) * 1.6
    return (
        <path
            d={`M${x} ${y} Q${cx} ${cy} ${ex} ${ey} Q${cx + nx} ${cy + ny} ${x + nx * 0.4} ${y + ny * 0.4} Z`}
            fill={fill}
            opacity="0.92"
        />
    )
}

function LeafTuft({ cx, cy, seed = 1, count = 7, scale = 1 }) {
    const items = []
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        items.push(
            <Sickle
                key={i}
                x={cx}
                y={cy}
                len={(5 + seededRandom(seed, i + 31) * 5) * scale}
                rot={(a * 180) / Math.PI}
                curl={(seededRandom(seed, i + 61) - 0.5) * 1.1}
                fill={seededRandom(seed, i + 91) > 0.5 ? p.fill : p.hi}
            />,
        )
    }
    return <g>{items}</g>
}

const MATURE_BLOBS = [
    { cx: 50, cy: 20, rx: 23, ry: 13 },
    { cx: 30, cy: 26, rx: 11, ry: 9 },
    { cx: 70, cy: 26, rx: 11, ry: 9 },
    { cx: 40, cy: 13, rx: 12, ry: 8 },
    { cx: 60, cy: 13, rx: 12, ry: 8 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 26, rx: 16, ry: 10 },
    { cx: 35, cy: 32, rx: 9, ry: 7 },
    { cx: 65, cy: 32, rx: 9, ry: 7 },
    { cx: 50, cy: 19, rx: 11, ry: 7 },
]

/** Полоса отслоившейся коры. */
function BarkStrip({ x, y, h = 10, w = 1.4, tone = '#ded7c7' }) {
    return (
        <path
            d={`M${x} ${y} C${x - 1.4} ${y + h * 0.35} ${x + 1.2} ${y + h * 0.6} ${x - 0.4} ${y + h}`}
            stroke={tone}
            strokeWidth={w}
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
        />
    )
}

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={16} tone="#8f9a6a" />
            <path d="M50 94 C48 86 52 79 50 71" stroke={p.bark.base} strokeWidth="3" strokeLinecap="round" fill="none" />
            <BarkStrip x={50} y={78} h={12} w={1.2} />
            <Crown p={p} seed={14} shadow={0.16} gloss={0.3} depth={1.5} blobs={[{ cx: 50, cy: 66, rx: 8, ry: 6 }]} />
            <LeafTuft cx={50} cy={64} seed={5} count={5} scale={0.7} />
            <LeafTuft cx={42} cy={70} seed={7} count={3} scale={0.6} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={21} tone="#8f9a6a" />
            <Trunk d="M50 94 C49 78 52 58 50 40" width={4.4} bark={p.bark} />
            <BarkStrip x={49} y={80} h={14} w={1.4} />
            <BarkStrip x={52} y={66} h={12} w={1.2} />
            <BarkStrip x={48} y={52} h={10} w={1.1} />
            <Branches
                bark={p.bark}
                width={2}
                ds={['M50 60 C43 56 38 48 36 42', 'M50 54 C58 50 62 44 64 38', 'M50 44 C47 40 45 34 45 30']}
            />
            <Crown p={p} seed={26} blobs={YOUNG_BLOBS} shadow={0.2} gloss={0.28} />
            <Texture p={p} seed={36} count={12} size={1.1} area={{ cx: 50, cy: 26, rx: 17, ry: 11 }} />
            <LeafTuft cx={36} cy={36} seed={46} count={5} scale={0.9} />
            <LeafTuft cx={64} cy={34} seed={56} count={5} scale={0.9} />
            <LeafTuft cx={50} cy={22} seed={66} count={6} scale={1} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="90" rx="22" ry="6" fill={p.shade} opacity="0.12" />
            <Ground rx={26} tone="#8f9a6a" />
            <Trunk d="M50 96 C47 72 53 40 51 20" width={7.4} bark={p.bark} />
            <BarkStrip x={47} y={84} h={22} w={1.8} />
            <BarkStrip x={53} y={70} h={20} w={1.6} />
            <BarkStrip x={46} y={54} h={18} w={1.4} />
            <BarkStrip x={54} y={40} h={14} w={1.3} />
            <Branches
                bark={p.bark}
                width={2.8}
                ds={[
                    'M50 52 C40 46 30 34 26 22',
                    'M51 46 C62 40 72 30 76 18',
                    'M50 38 C43 32 38 24 36 16',
                    'M50 34 C58 28 62 22 64 14',
                ]}
            />
            <Crown p={p} seed={116} blobs={MATURE_BLOBS} shadow={0.24} gloss={0.3} depth={3} />
            <Texture p={p} seed={136} count={20} size={1.3} area={{ cx: 50, cy: 20, rx: 24, ry: 14 }} />
            <LeafTuft cx={28} cy={24} seed={146} count={7} scale={1.2} />
            <LeafTuft cx={72} cy={24} seed={156} count={7} scale={1.2} />
            <LeafTuft cx={50} cy={14} seed={166} count={8} scale={1.3} />
            <LeafTuft cx={38} cy={18} seed={176} count={6} scale={1.1} />
            <LeafTuft cx={62} cy={18} seed={186} count={6} scale={1.1} />
        </Stage>
    )
}
