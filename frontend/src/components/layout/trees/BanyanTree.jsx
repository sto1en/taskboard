// frontend/src/components/layout/trees/BanyanTree.jsx

/**
 * Баньян — самый широкий силуэт из всех: плоская «зонтичная» крона,
 * под которой свисают воздушные корни, а ствол стоит на «ходулях».
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Stage } from './kit'
import { seededRandom } from './common'

const p = PALETTE.banyan

/** Воздушный корень: тонкая линия до земли с утолщением у основания. */
function AerialRoot({ x0, y0, x1, y1, w = 0.9, seed = 1 }) {
    return (
        <g>
            <path
                d={`M${x0} ${y0} C${x0 + (seededRandom(seed, 1) - 0.5) * 3} ${(y0 + y1) / 2} ${x1} ${(y0 + y1) / 2 + 3} ${x1} ${y1}`}
                stroke={p.bark.base}
                strokeWidth={w}
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
            />
            <ellipse cx={x1} cy={y1} rx={w * 1.4} ry={w * 0.5} fill={p.bark.dark} opacity="0.5" />
        </g>
    )
}

/** Ствол-«ходули»: несколько толстых опор. */
function StiltTrunk() {
    return (
        <g>
            <path d="M50 96 C48 82 52 66 50 52" stroke={p.bark.base} strokeWidth="8.6" strokeLinecap="round" fill="none" />
            <path d="M46 94 C38 86 34 76 33 66" stroke={p.bark.base} strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M55 94 C63 86 67 76 68 66" stroke={p.bark.base} strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M50 90 C52 80 50 70 51 60" stroke={p.bark.light} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M46 90 C40 84 37 76 36 68" stroke={p.bark.light} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
        </g>
    )
}

const MATURE_BLOBS = [
    { cx: 50, cy: 24, rx: 39, ry: 14 },
    { cx: 20, cy: 28, rx: 13, ry: 10 },
    { cx: 80, cy: 28, rx: 13, ry: 10 },
    { cx: 34, cy: 20, rx: 16, ry: 11 },
    { cx: 66, cy: 20, rx: 16, ry: 11 },
    { cx: 50, cy: 16, rx: 20, ry: 11 },
    { cx: 12, cy: 34, rx: 8, ry: 7 },
    { cx: 88, cy: 34, rx: 8, ry: 7 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 30, rx: 24, ry: 12 },
    { cx: 30, cy: 33, rx: 10, ry: 8 },
    { cx: 70, cy: 33, rx: 10, ry: 8 },
    { cx: 50, cy: 24, rx: 15, ry: 9 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={18} />
            <path d="M50 94 C49 86 51 78 50 70" stroke={p.bark.base} strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M50 84 C44 81 41 77 40 73" stroke={p.bark.base} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M50 81 C56 78 59 74 60 70" stroke={p.bark.base} strokeWidth="2" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={12}
                shadow={0.22}
                gloss={0.26}
                depth={2}
                blobs={[
                    { cx: 41, cy: 67, rx: 8, ry: 5 },
                    { cx: 59, cy: 65, rx: 8, ry: 5 },
                    { cx: 50, cy: 62, rx: 9, ry: 5.5 },
                ]}
            />
            <AerialRoot x0={41} y0={71} x1={40} y1={93} w={0.7} seed={2} />
            <AerialRoot x0={59} y0={69} x1={60} y1={93} w={0.7} seed={4} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={26} />
            <Trunk d="M50 94 C48 80 53 62 50 44" width={5} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.4}
                ds={['M50 66 C40 62 33 56 30 48', 'M50 60 C61 56 68 50 71 42', 'M50 50 C44 46 41 40 40 34']}
            />
            <Crown p={p} seed={24} blobs={YOUNG_BLOBS} shadow={0.26} gloss={0.22} />
            <Texture p={p} seed={34} count={18} size={1.3} area={{ cx: 50, cy: 30, rx: 25, ry: 13 }} />
            <Edge p={p} seed={44} count={10} size={1.6} ring={ringPoints(50, 30, 24, 12, 20, 11)} />
            <AerialRoot x0={32} y0={40} x1={33} y1={93} w={0.8} seed={6} />
            <AerialRoot x0={68} y0={40} x1={67} y1={93} w={0.8} seed={8} />
            <AerialRoot x0={50} y0={43} x1={50} y1={93} w={0.9} seed={10} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="90" rx="34" ry="8" fill={p.shade} opacity="0.12" />
            <Ground rx={34} />
            <StiltTrunk />
            <Branches
                bark={p.bark}
                width={3}
                ds={[
                    'M50 62 C36 58 22 47 16 34',
                    'M50 56 C64 52 78 41 84 28',
                    'M50 46 C42 42 34 34 30 26',
                    'M50 44 C60 40 68 32 72 24',
                ]}
            />
            <Crown p={p} seed={114} blobs={MATURE_BLOBS} shadow={0.3} gloss={0.22} depth={4} />
            <Texture p={p} seed={134} count={30} size={1.5} area={{ cx: 50, cy: 22, rx: 38, ry: 14 }} />
            <Edge p={p} seed={154} count={22} size={1.8} ring={ringPoints(50, 24, 38, 13, 30, 7)} />
            <AerialRoot x0={22} y0={40} x1={23} y1={94} w={1} seed={16} />
            <AerialRoot x0={30} y0={46} x1={31} y1={94} w={0.9} seed={18} />
            <AerialRoot x0={42} y0={52} x1={43} y1={94} w={0.85} seed={20} />
            <AerialRoot x0={58} y0={52} x1={57} y1={94} w={0.85} seed={22} />
            <AerialRoot x0={70} y0={46} x1={69} y1={94} w={0.9} seed={24} />
            <AerialRoot x0={78} y0={40} x1={77} y1={94} w={1} seed={26} />
        </Stage>
    )
}
