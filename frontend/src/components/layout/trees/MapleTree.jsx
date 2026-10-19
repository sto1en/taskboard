// frontend/src/components/layout/trees/MapleTree.jsx

/**
 * Клён — огненно-оранжевая крона, кленовые листья-«звёздочки» по краю
 * и пара крылаток (семян), которые висят под кроной.
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Stage } from './kit'
import { seededRandom } from './common'

const p = PALETTE.maple

/** Кленовый лист: пять острых лопастей одним путём. */
function MapleLeaf({ x, y, s = 3, rot = 0, fill = '#c8512c', dark = '#8a2a10' }) {
    const d = `M${x} ${y - s * 1.5}
        L${x + s * 0.34} ${y - s * 0.5} L${x + s * 1.15} ${y - s * 0.75}
        L${x + s * 0.62} ${y} L${x + s * 1.2} ${y + s * 0.55}
        L${x + s * 0.3} ${y + s * 0.5} L${x + s * 0.18} ${y + s * 1.2}
        L${x - s * 0.18} ${y + s * 1.2} L${x - s * 0.3} ${y + s * 0.5}
        L${x - s * 1.2} ${y + s * 0.55} L${x - s * 0.62} ${y}
        L${x - s * 1.15} ${y - s * 0.75} L${x - s * 0.34} ${y - s * 0.5} Z`
    return (
        <g transform={`rotate(${rot} ${x} ${y})`}>
            <path d={d} fill={fill} />
            <path d={d} fill={dark} opacity="0.25" transform={`translate(${s * 0.12} ${s * 0.18})`} />
        </g>
    )
}

/** Крылатка — семя клёна с крылышком. */
function Samara({ x, y, rot = 0, s = 2.4 }) {
    return (
        <g transform={`rotate(${rot} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx={s * 0.34} ry={s * 0.5} fill="#7a4a12" />
            <path
                d={`M${x} ${y - s * 0.35} C${x + s * 0.9} ${y - s * 0.9} ${x + s * 1.8} ${y - s * 0.6} ${x + s * 1.9} ${y + s * 0.2}
                    C${x + s * 1.1} ${y + s * 0.25} ${x + s * 0.3} ${y + s * 0.2} ${x} ${y + s * 0.25} Z`}
                fill="#d8a352"
                opacity="0.95"
            />
        </g>
    )
}

function LeafRing({ cx, cy, rx, ry, seed, count, size }) {
    const items = []
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        const x = cx + Math.cos(a) * rx * (0.95 + seededRandom(seed, i) * 0.1)
        const y = cy + Math.sin(a) * ry * (0.95 + seededRandom(seed, i + 9) * 0.1)
        items.push(
            <MapleLeaf
                key={i}
                x={x}
                y={y}
                s={size * (0.75 + seededRandom(seed, i + 19) * 0.45)}
                rot={seededRandom(seed, i + 29) * 360}
                fill={i % 3 === 0 ? '#f08a3c' : i % 3 === 1 ? '#c8512c' : '#e06a22'}
            />,
        )
    }
    return <g>{items}</g>
}

const MATURE_BLOBS = [
    { cx: 50, cy: 30, rx: 29, ry: 21 },
    { cx: 24, cy: 40, rx: 14, ry: 11 },
    { cx: 76, cy: 40, rx: 14, ry: 11 },
    { cx: 33, cy: 20, rx: 15, ry: 11 },
    { cx: 67, cy: 20, rx: 15, ry: 11 },
    { cx: 50, cy: 14, rx: 16, ry: 10 },
    { cx: 50, cy: 46, rx: 18, ry: 10 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 34, rx: 17, ry: 13 },
    { cx: 36, cy: 43, rx: 10, ry: 8 },
    { cx: 64, cy: 43, rx: 10, ry: 8 },
    { cx: 45, cy: 25, rx: 10, ry: 8 },
    { cx: 57, cy: 25, rx: 10, ry: 8 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} dry />
            <path d="M50 94 C48 85 52 77 50 68" stroke={p.bark.base} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M50 81 C44 78 41 74 40 70" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <path d="M50 78 C56 75 59 71 60 67" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={9}
                shadow={0.2}
                gloss={0.24}
                depth={2}
                blobs={[
                    { cx: 41, cy: 67, rx: 6.5, ry: 4.8 },
                    { cx: 59, cy: 65, rx: 6.5, ry: 4.8 },
                    { cx: 50, cy: 60, rx: 8, ry: 6 },
                ]}
            />
            <Texture p={p} seed={19} count={10} size={1.1} area={{ cx: 50, cy: 64, rx: 13, ry: 7 }} />
            <MapleLeaf x={50} y={54} s={2.6} fill="#f08a3c" />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={23} dry />
            <Trunk d="M50 94 C48 76 53 55 50 37" width={4.4} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.2}
                ds={['M50 66 C44 62 39 55 37 48', 'M50 60 C58 56 62 50 64 43', 'M50 49 C47 45 45 39 45 33']}
            />
            <Crown p={p} seed={21} blobs={YOUNG_BLOBS} shadow={0.24} gloss={0.24} />
            <Texture p={p} seed={31} count={18} size={1.2} area={{ cx: 50, cy: 34, rx: 18, ry: 13 }} />
            <LeafRing cx={50} cy={34} rx={17} ry={12} seed={41} count={7} size={2.4} />
            <Samara x={40} y={50} rot={20} s={2.2} />
            <Samara x={60} y={48} rot={-35} s={2} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="35" ry="9" fill={p.shade} opacity="0.10" />
            <Ground rx={30} dry />
            <Trunk d="M50 96 C45 74 56 50 50 25" width={7.5} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={3.1}
                ds={[
                    'M50 68 C40 62 31 52 27 41',
                    'M51 61 C62 55 70 45 73 34',
                    'M50 48 C43 42 38 32 37 24',
                    'M50 42 C58 36 62 28 64 20',
                ]}
            />
            <Crown p={p} seed={111} blobs={MATURE_BLOBS} shadow={0.28} gloss={0.24} depth={4} />
            <Texture p={p} seed={131} count={26} size={1.5} area={{ cx: 50, cy: 30, rx: 30, ry: 21 }} />
            <LeafRing cx={50} cy={30} rx={29} ry={20} seed={151} count={11} size={3.1} />
            <Samara x={34} y={52} rot={15} s={2.8} />
            <Samara x={52} y={55} rot={-25} s={2.6} />
            <Samara x={66} y={50} rot={40} s={2.5} />
        </Stage>
    )
}
