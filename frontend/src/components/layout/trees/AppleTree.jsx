// frontend/src/components/layout/trees/AppleTree.jsx

/**
 * Яблоня — приземистая округлая крона, красные и жёлто-зелёные яблоки.
 */

import { PALETTE, Ground, Crown, Texture, Edge, ringPoints, Trunk, Branches, Fruits, Stage } from './kit'

const p = PALETTE.apple

const APPLE_COLORS = [
    { color: '#d43a2e', shade: '#8a1a14', hi: '#f8857b', stem: true },
    { color: '#c9d34a', shade: '#7f8a1c', hi: '#eaf28c', stem: true },
    { color: '#e0553f', shade: '#93241a', hi: '#ffa08e', stem: true },
]

const MATURE_BLOBS = [
    { cx: 50, cy: 34, rx: 27, ry: 20 },
    { cx: 26, cy: 42, rx: 14, ry: 12 },
    { cx: 74, cy: 42, rx: 14, ry: 12 },
    { cx: 34, cy: 24, rx: 15, ry: 12 },
    { cx: 66, cy: 24, rx: 15, ry: 12 },
    { cx: 50, cy: 20, rx: 17, ry: 11 },
    { cx: 24, cy: 57, rx: 10, ry: 8 },
    { cx: 76, cy: 57, rx: 10, ry: 8 },
    { cx: 50, cy: 48, rx: 18, ry: 11 },
]

const YOUNG_BLOBS = [
    { cx: 50, cy: 36, rx: 17, ry: 13 },
    { cx: 36, cy: 44, rx: 10, ry: 8 },
    { cx: 64, cy: 44, rx: 10, ry: 8 },
    { cx: 44, cy: 28, rx: 10, ry: 8 },
    { cx: 56, cy: 28, rx: 10, ry: 8 },
]

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={17} />
            <path d="M50 94 C49 85 51 77 50 69" stroke={p.bark.base} strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M50 82 C44 79 41 75 40 71" stroke={p.bark.base} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M50 79 C56 76 59 72 60 68" stroke={p.bark.base} strokeWidth="2" strokeLinecap="round" fill="none" />
            <Crown
                p={p}
                seed={5}
                shadow={0.22}
                gloss={0.26}
                depth={2}
                blobs={[
                    { cx: 41, cy: 68, rx: 7, ry: 5 },
                    { cx: 59, cy: 66, rx: 7, ry: 5 },
                    { cx: 50, cy: 61, rx: 8, ry: 6.5 },
                ]}
            />
            <Texture p={p} seed={15} count={12} size={1.2} area={{ cx: 50, cy: 65, rx: 14, ry: 8 }} />
            <Fruits area={{ cx: 50, cy: 64, rx: 10, ry: 6 }} seed={25} count={2} r={1.7} colors={APPLE_COLORS} avoid={0.2} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={24} />
            <Trunk d="M50 94 C48 76 53 54 50 38" width={4.6} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={2.2}
                ds={['M50 66 C43 62 38 55 36 48', 'M50 60 C58 56 62 50 64 44', 'M50 50 C46 46 44 40 44 34']}
            />
            <Crown p={p} seed={17} blobs={YOUNG_BLOBS} shadow={0.26} gloss={0.22} />
            <Texture p={p} seed={27} count={18} size={1.3} area={{ cx: 50, cy: 36, rx: 19, ry: 14 }} />
            <Edge p={p} seed={37} count={10} size={1.6} ring={ringPoints(50, 36, 18, 13, 20, 8)} />
            <Fruits area={{ cx: 50, cy: 37, rx: 16, ry: 12 }} seed={47} count={4} r={2.1} colors={APPLE_COLORS} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="88" rx="34" ry="9" fill={p.shade} opacity="0.10" />
            <Ground rx={30} />
            <Trunk d="M50 96 C47 74 55 52 50 26" width={8} bark={p.bark} />
            <Branches
                bark={p.bark}
                width={3.4}
                ds={[
                    'M50 68 C40 62 31 52 28 42',
                    'M51 62 C62 56 70 46 73 36',
                    'M50 50 C43 44 39 34 38 26',
                    'M50 44 C58 38 62 30 64 22',
                ]}
            />
            <Crown p={p} seed={107} blobs={MATURE_BLOBS} shadow={0.3} gloss={0.22} depth={4} />
            <Texture p={p} seed={127} count={34} size={1.5} area={{ cx: 50, cy: 36, rx: 29, ry: 22 }} />
            <Edge p={p} seed={147} count={20} size={1.9} ring={ringPoints(50, 36, 28, 21, 24, 5)} />
            <Fruits area={{ cx: 50, cy: 36, rx: 25, ry: 19 }} seed={167} count={9} r={2.6} colors={APPLE_COLORS} />
        </Stage>
    )
}
