// frontend/src/components/layout/trees/OakTree.jsx

/**
 * Дуб — тяжёлая, широко раскинутая крона на толстом стволе.
 * Плоды — жёлуди на коротких ножках под кроной.
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Bark, Stage } from './kit'

const p = PALETTE.oak

// Жёлудь: орех + плюска
function Acorn({ x, y, r = 2 }) {
    return (
        <g>
            <line x1={x} y1={y - r * 1.9} x2={x} y2={y - r * 1.1} stroke="#4a3419" strokeWidth={r * 0.22} strokeLinecap="round" />
            <path
                d={`M${x - r * 0.9} ${y - r * 0.7} Q${x} ${y + r * 1.6} ${x + r * 0.9} ${y - r * 0.7} Z`}
                fill="#c08a3c"
            />
            <path
                d={`M${x - r * 0.9} ${y - r * 0.7} L${x - r * 0.55} ${y - r * 1.35} Q${x} ${y - r * 1.8} ${x + r * 0.55} ${y - r * 1.35} L${x + r * 0.9} ${y - r * 0.7} Z`}
                fill="#6b4a22"
            />
            <ellipse cx={x - r * 0.3} cy={y + r * 0.3} rx={r * 0.22} ry={r * 0.4} fill="#e0b578" opacity="0.7" />
        </g>
    )
}

const MATURE_BLOBS = [
    { cx: 50, cy: 30, rx: 30, ry: 21 },
    { cx: 22, cy: 42, rx: 16, ry: 13 },
    { cx: 78, cy: 42, rx: 16, ry: 13 },
    { cx: 31, cy: 21, rx: 17, ry: 14 },
    { cx: 69, cy: 21, rx: 17, ry: 14 },
    { cx: 50, cy: 15, rx: 18, ry: 12 },
    { cx: 20, cy: 60, rx: 12, ry: 9 },
    { cx: 80, cy: 60, rx: 12, ry: 9 },
    { cx: 50, cy: 46, rx: 19, ry: 12 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 33, rx: 19, ry: 14 },
    { cx: 33, cy: 42, rx: 11, ry: 9 },
    { cx: 67, cy: 42, rx: 11, ry: 9 },
    { cx: 42, cy: 25, rx: 11, ry: 9 },
    { cx: 58, cy: 25, rx: 11, ry: 9 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} />
            <path d="M50 94 C48 84 52 76 50 67" stroke={p.bark.base} strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M50 80 C43 76 40 71 39 67" stroke={p.bark.base} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M50 76 C57 72 60 67 61 63" stroke={p.bark.base} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={3}
                shadow={0.22}
                gloss={0.24}
                depth={2}
                blobs={[
                    { cx: 39, cy: 65, rx: 7, ry: 5.5 },
                    { cx: 61, cy: 61, rx: 7, ry: 5.5 },
                    { cx: 50, cy: 58, rx: 8.5, ry: 7 },
                ]}
            />
            <Texture p={p} seed={9} count={12} size={1.2} area={{ cx: 50, cy: 61, rx: 15, ry: 8 }} />
            <Acorn x={44} y={72} r={1.3} />
            <Acorn x={57} y={70} r={1.1} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={24} />
            <Trunk d="M50 94 C48 74 53 52 50 33" width={5} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.4}
                ds={['M50 62 C43 57 38 51 35 45', 'M50 56 C58 52 63 46 66 40', 'M50 46 C45 42 43 36 42 31']}
            />
            <Crown p={p} seed={11} blobs={YOUNG_BLOBS} shadow={0.28} gloss={0.2} />
            <Texture p={p} seed={21} count={20} size={1.3} area={{ cx: 50, cy: 33, rx: 21, ry: 15 }} />
            <Edge p={p} seed={31} count={12} size={1.7} ring={ringPoints(50, 33, 20, 14, 22, 4)} />
            <Acorn x={40} y={48} r={1.4} />
            <Acorn x={60} y={47} r={1.4} />
            <Acorn x={50} y={50} r={1.3} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="40" ry="10" fill={p.shade} opacity="0.10" />
            <Ground rx={33} />
            <Trunk d="M50 96 C45 74 56 50 49 24" width={9} bark={p.bark} />
            <Bark x={48} y1={40} y2={90} color={p.bark.dark} seed={5} count={7} />
            <Branches
                bark={p.bark}
                width={4}
                ds={[
                    'M50 66 C38 60 28 50 23 40',
                    'M52 60 C64 54 74 44 78 34',
                    'M49 48 C40 42 35 32 32 24',
                    'M50 40 C60 34 66 26 68 18',
                ]}
            />
            <Crown p={p} seed={101} blobs={MATURE_BLOBS} shadow={0.32} gloss={0.2} depth={5} />
            <Texture p={p} seed={121} count={40} size={1.6} area={{ cx: 50, cy: 34, rx: 32, ry: 24 }} />
            <Edge p={p} seed={141} count={22} size={2} ring={ringPoints(50, 34, 31, 23, 26, 6)} />
            <Acorn x={33} y={58} r={1.9} />
            <Acorn x={44} y={62} r={1.7} />
            <Acorn x={58} y={61} r={1.9} />
            <Acorn x={68} y={56} r={1.6} />
        </Stage>
    )
}
