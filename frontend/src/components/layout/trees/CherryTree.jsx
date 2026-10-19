// frontend/src/components/layout/trees/CherryTree.jsx

/**
 * Черешня — розовая крона (в мае), тёмные вишни парами на длинных черешках.
 * От сакуры отличается плодами и более плотной, «зернистой» кроной.
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Stage } from './kit'

const p = PALETTE.cherry

function CherryPair({ x, y, s = 1 }) {
    return (
        <g>
            <path
                d={`M${x} ${y - 5 * s} C${x + 1.2 * s} ${y - 3 * s} ${x + 0.6 * s} ${y - 1.4 * s} ${x + 0.9 * s} ${y}`}
                stroke="#3f6b28"
                strokeWidth={0.5 * s}
                strokeLinecap="round"
                fill="none"
            />
            <path
                d={`M${x} ${y - 5 * s} C${x - 1.4 * s} ${y - 3.4 * s} ${x - 1 * s} ${y - 1.4 * s} ${x - 1.1 * s} ${y}`}
                stroke="#3f6b28"
                strokeWidth={0.5 * s}
                strokeLinecap="round"
                fill="none"
            />
            <circle cx={x + 0.9 * s} cy={y + 1 * s} r={1.5 * s} fill="#b3142f" />
            <circle cx={x + 0.55 * s} cy={y + 0.6 * s} r={0.5 * s} fill="#ff8a9e" opacity="0.8" />
            <circle cx={x - 1.1 * s} cy={y + 1.2 * s} r={1.35 * s} fill="#97102a" />
            <circle cx={x - 1.4 * s} cy={y + 0.8 * s} r={0.45 * s} fill="#ff8a9e" opacity="0.8" />
            <path
                d={`M${x} ${y - 5 * s} C${x + 2 * s} ${y - 6.6 * s} ${x + 3.4 * s} ${y - 5.4 * s} ${x + 3.6 * s} ${y - 4 * s}
                    C${x + 2.2 * s} ${y - 3.6 * s} ${x + 0.8 * s} ${y - 4.1 * s} ${x} ${y - 5 * s} Z`}
                fill="#5b9440"
            />
        </g>
    )
}

const MATURE_BLOBS = [
    { cx: 50, cy: 30, rx: 30, ry: 22 },
    { cx: 23, cy: 40, rx: 15, ry: 12 },
    { cx: 77, cy: 40, rx: 15, ry: 12 },
    { cx: 32, cy: 20, rx: 16, ry: 12 },
    { cx: 68, cy: 20, rx: 16, ry: 12 },
    { cx: 50, cy: 14, rx: 17, ry: 10 },
    { cx: 21, cy: 58, rx: 11, ry: 8 },
    { cx: 79, cy: 58, rx: 11, ry: 8 },
    { cx: 50, cy: 45, rx: 19, ry: 11 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 33, rx: 18, ry: 14 },
    { cx: 34, cy: 41, rx: 10, ry: 8 },
    { cx: 66, cy: 41, rx: 10, ry: 8 },
    { cx: 43, cy: 24, rx: 10, ry: 8 },
    { cx: 57, cy: 24, rx: 10, ry: 8 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} />
            <path d="M50 94 C48 85 52 77 50 68" stroke={p.bark.base} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M50 81 C44 78 41 74 40 70" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <path d="M50 78 C56 75 59 71 60 67" stroke={p.bark.base} strokeWidth="1.9" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={7}
                shadow={0.2}
                gloss={0.3}
                depth={2}
                blobs={[
                    { cx: 41, cy: 67, rx: 6.5, ry: 4.5 },
                    { cx: 59, cy: 65, rx: 6.5, ry: 4.5 },
                    { cx: 50, cy: 60, rx: 8, ry: 6 },
                ]}
            />
            <Texture p={p} seed={17} count={12} size={1.1} area={{ cx: 50, cy: 64, rx: 14, ry: 8 }} />
            <CherryPair x={46} y={71} s={0.8} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={23} />
            <Trunk d="M50 94 C48 75 53 54 50 36" width={4.4} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.2}
                ds={['M50 65 C43 61 38 54 36 47', 'M50 59 C58 55 62 49 64 43', 'M50 49 C46 45 44 39 44 33']}
            />
            <Crown p={p} seed={19} blobs={YOUNG_BLOBS} shadow={0.24} gloss={0.26} />
            <Texture p={p} seed={29} count={18} size={1.2} area={{ cx: 50, cy: 33, rx: 19, ry: 14 }} />
            <Edge p={p} seed={39} count={10} size={1.5} ring={ringPoints(50, 33, 18, 13, 20, 9)} />
            <CherryPair x={38} y={49} s={1.1} />
            <CherryPair x={60} y={46} s={1} />
            <CherryPair x={50} y={52} s={0.95} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="36" ry="9" fill={p.shade} opacity="0.09" />
            <Ground rx={31} />
            <Trunk d="M50 96 C45 74 56 50 50 24" width={7.5} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={3.2}
                ds={[
                    'M50 68 C40 62 30 52 26 41',
                    'M51 61 C62 55 71 45 74 35',
                    'M50 48 C42 42 37 32 36 25',
                    'M50 42 C59 36 63 28 65 21',
                ]}
            />
            <Crown p={p} seed={109} blobs={MATURE_BLOBS} shadow={0.28} gloss={0.26} depth={4} />
            <Texture p={p} seed={129} count={32} size={1.4} area={{ cx: 50, cy: 32, rx: 31, ry: 23 }} />
            <Edge p={p} seed={149} count={18} size={1.8} ring={ringPoints(50, 32, 30, 22, 24, 6)} />
            <CherryPair x={30} y={52} s={1.4} />
            <CherryPair x={50} y={46} s={1.3} />
            <CherryPair x={68} y={50} s={1.4} />
            <CherryPair x={40} y={34} s={1.2} />
            <CherryPair x={60} y={32} s={1.2} />
        </Stage>
    )
}
