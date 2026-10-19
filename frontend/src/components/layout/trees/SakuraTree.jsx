// frontend/src/components/layout/trees/SakuraTree.jsx

/**
 * Сакура — ажурная крона из розовых «облаков», ветви слегка изогнуты,
 * лепестки опадают даже в статике (несколько лепестков у земли).
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Stage } from './kit'
import { seededRandom } from './common'

const p = PALETTE.sakura

function Petal({ x, y, rot = 0, s = 2, fill = '#ffd0e0' }) {
    return (
        <path
            d={`M${x} ${y - s} C${x + s * 0.85} ${y - s * 0.55} ${x + s * 0.7} ${y + s * 0.6} ${x} ${y + s * 0.85}
                C${x - s * 0.7} ${y + s * 0.6} ${x - s * 0.85} ${y - s * 0.55} ${x} ${y - s} Z`}
            fill={fill}
            opacity="0.9"
            transform={`rotate(${rot} ${x} ${y})`}
        />
    )
}

// Несколько лепестков-«конфетти» вокруг земли
function FallenPetals({ seed = 1 }) {
    const items = []
    for (let i = 0; i < 6; i++) {
        const x = 26 + seededRandom(seed, i) * 46
        const y = 94 + seededRandom(seed, i + 33) * 2.5
        items.push(<Petal key={i} x={x} y={y} s={1.6} rot={seededRandom(seed, i + 7) * 360} />)
    }
    return <g opacity="0.85">{items}</g>
}

const MATURE_BLOBS = [
    { cx: 50, cy: 28, rx: 31, ry: 20 },
    { cx: 22, cy: 38, rx: 14, ry: 11 },
    { cx: 78, cy: 38, rx: 14, ry: 11 },
    { cx: 30, cy: 18, rx: 15, ry: 10 },
    { cx: 70, cy: 18, rx: 15, ry: 10 },
    { cx: 50, cy: 12, rx: 16, ry: 9 },
    { cx: 24, cy: 55, rx: 10, ry: 7 },
    { cx: 76, cy: 55, rx: 10, ry: 7 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 32, rx: 18, ry: 13 },
    { cx: 35, cy: 40, rx: 10, ry: 7.5 },
    { cx: 65, cy: 40, rx: 10, ry: 7.5 },
    { cx: 44, cy: 23, rx: 10, ry: 7 },
    { cx: 57, cy: 23, rx: 10, ry: 7 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} tone="#88ad5a" />
            <FallenPetals seed={4} />
            <path d="M50 94 C48 86 52 79 50 71" stroke={p.bark.base} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M50 83 C45 80 42 76 41 72" stroke={p.bark.base} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M50 80 C55 77 58 74 59 70" stroke={p.bark.base} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={8}
                shadow={0.16}
                gloss={0.36}
                depth={2}
                blobs={[
                    { cx: 42, cy: 68, rx: 6.5, ry: 4.5 },
                    { cx: 58, cy: 66, rx: 6.5, ry: 4.5 },
                    { cx: 50, cy: 62, rx: 8, ry: 5.5 },
                ]}
            />
            <Texture p={p} seed={18} count={10} size={1} area={{ cx: 50, cy: 66, rx: 13, ry: 7 }} />
            <Petal x={50} y={58} s={2.2} fill="#fff0f5" />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={22} tone="#88ad5a" />
            <FallenPetals seed={14} />
            <Trunk d="M50 94 C48 76 53 56 51 36" width={4.2} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.1}
                ds={['M50 66 C43 62 39 56 37 48', 'M51 60 C58 56 62 50 64 42', 'M50 48 C46 44 43 38 43 32']}
            />
            <Crown p={p} seed={20} blobs={YOUNG_BLOBS} shadow={0.18} gloss={0.34} />
            <Texture p={p} seed={30} count={16} size={1.1} area={{ cx: 50, cy: 32, rx: 19, ry: 14 }} />
            <Edge p={p} seed={40} count={12} size={1.6} ring={ringPoints(50, 32, 18, 13, 20, 10)} />
            <Petal x={36} y={46} s={2.4} fill="#ffe0eb" />
            <Petal x={62} y={44} s={2.2} fill="#fff3f8" rot={40} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="34" ry="9" fill={p.shade} opacity="0.08" />
            <Ground rx={30} tone="#88ad5a" />
            <FallenPetals seed={24} />
            <Trunk d="M50 96 C44 76 57 52 50 26" width={6.5} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.8}
                ds={[
                    'M50 70 C38 64 28 54 24 42',
                    'M52 62 C64 56 72 46 76 34',
                    'M50 48 C40 42 34 32 33 24',
                    'M50 42 C60 36 65 28 67 20',
                ]}
            />
            <Crown p={p} seed={110} blobs={MATURE_BLOBS} shadow={0.18} gloss={0.34} depth={4} />
            <Texture p={p} seed={130} count={30} size={1.3} area={{ cx: 50, cy: 30, rx: 31, ry: 21 }} />
            <Edge p={p} seed={150} count={20} size={1.9} ring={ringPoints(50, 30, 30, 20, 26, 7)} />
            <Petal x={26} y={46} s={2.8} fill="#ffe0eb" />
            <Petal x={74} y={44} s={2.6} fill="#fff3f8" rot={55} />
            <Petal x={50} y={10} s={2.4} fill="#fff0f5" rot={-20} />
            <Petal x={36} y={24} s={2.2} fill="#ffd8e6" rot={70} />
        </Stage>
    )
}
