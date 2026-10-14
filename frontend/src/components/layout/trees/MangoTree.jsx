import { Aura, SparkleRing, seededRandom } from './common'

// Крупный овальный лист манго (с заострённым кончиком)
function MangoLeaf({ cx, cy, r = 4, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#6fb03d', vein: '#4a8a24', edge: '#3f7a2a' },
        mid:   { fill: '#3e7a1e', vein: '#265418', edge: '#1c4610' },
        deep:  { fill: '#2a5c14', vein: '#184210', edge: '#0f2f0a' },
    }
    const c = palette[tone] || palette.mid
    const s = r
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - s * 1.8}
                     C${cx + s * 0.9} ${cy - s * 1.3} ${cx + s * 1.1} ${cy - s * 0.3} ${cx + s * 0.5} ${cy + s * 0.6}
                     C${cx + s * 0.2} ${cy + s * 1.3} ${cx + s * 0.05} ${cy + s * 1.6} ${cx} ${cy + s * 1.8}
                     C${cx - s * 0.05} ${cy + s * 1.6} ${cx - s * 0.2} ${cy + s * 1.3} ${cx - s * 0.5} ${cy + s * 0.6}
                     C${cx - s * 1.1} ${cy - s * 0.3} ${cx - s * 0.9} ${cy - s * 1.3} ${cx} ${cy - s * 1.8} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            <line x1={cx} y1={cy - s * 1.6} x2={cx} y2={cy + s * 1.6}
                  stroke={c.vein} strokeWidth={s * 0.1} opacity="0.7"/>
        </g>
    )
}

// Крупное манго — жёлто-оранжевый овал с румянцем
function MangoFruit({ cx, cy, r = 4 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.25} fill="#ffa726"/>
            {/* Красный румянец */}
            <ellipse cx={cx + r * 0.35} cy={cy - r * 0.2} rx={r * 0.5} ry={r * 0.7}
                     fill="#e64a19" opacity="0.75"/>
            {/* Блик */}
            <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.3} ry={r * 0.4}
                     fill="#ffe0b2" opacity="0.7"/>
            {/* Хвостик */}
            <line x1={cx} y1={cy - r * 1.2} x2={cx + r * 0.1} y2={cy - r * 1.5}
                  stroke="#4d3a2a" strokeWidth={r * 0.12} strokeLinecap="round"/>
        </g>
    )
}

function MangoCluster({ cx, cy, radius = 9, count = 14, seed = 0, withMango = true }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <MangoLeaf key={i} cx={lx} cy={ly}
                       r={3.2 + seededRandom(seed, i + 200) * 1.2}
                       rot={seededRandom(seed, i + 300) * 360}
                       tone={tones[i % tones.length]}/>
        )
    }
    if (withMango && seededRandom(seed, 400) > 0.5) {
        items.push(
            <MangoFruit key="m1" cx={cx + radius * 0.3} cy={cy + radius * 0.3}
                        r={3 + seededRandom(seed, 500) * 1}/>
        )
    }
    if (withMango && seededRandom(seed, 600) > 0.65) {
        items.push(
            <MangoFruit key="m2" cx={cx - radius * 0.4} cy={cy + radius * 0.1}
                        r={2.6 + seededRandom(seed, 700) * 0.8}/>
        )
    }
    return <g>{items}</g>
}

function MangoTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C48 84 52 72 50 60 C48 48 52 36 50 ${topY}`}
                  stroke="#5c3a1e" strokeWidth="8" strokeLinecap="round" fill="none"/>
            <path d={`M46 90 C45 80 49 70 47 60`}
                  stroke="#7a5233" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M53 80 C52 72 54 64 52 56"
                  stroke="#2f1d14" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M45 74 C44 68 47 62 48 58"
                  stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

function MangoBranches({ topY = 18 }) {
    return (
        <g stroke="#5c3a1e" strokeLinecap="round" fill="none">
            <path d={`M50 ${topY + 4} C40 ${topY - 2} 28 ${topY - 2} 18 ${topY + 4}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY + 4} C60 ${topY - 2} 72 ${topY - 2} 82 ${topY + 4}`} strokeWidth="3.4"/>

            <path d={`M50 ${topY + 16} C38 ${topY + 12} 24 ${topY + 14} 14 ${topY + 22}`} strokeWidth="3.6"/>
            <path d={`M50 ${topY + 16} C62 ${topY + 12} 76 ${topY + 14} 86 ${topY + 22}`} strokeWidth="3.6"/>

            <path d={`M50 ${topY + 30} C38 ${topY + 28} 24 ${topY + 32} 16 ${topY + 40}`} strokeWidth="3.2"/>
            <path d={`M50 ${topY + 30} C62 ${topY + 28} 76 ${topY + 32} 84 ${topY + 40}`} strokeWidth="3.2"/>

            <path d={`M18 ${topY + 4} C14 ${topY - 2} 12 ${topY - 6} 14 ${topY - 10}`} strokeWidth="2"/>
            <path d={`M82 ${topY + 4} C86 ${topY - 2} 88 ${topY - 6} 86 ${topY - 10}`} strokeWidth="2"/>

            <path d={`M14 ${topY + 22} C10 ${topY + 26} 8 ${topY + 32} 10 ${topY + 38}`} strokeWidth="1.8"/>
            <path d={`M86 ${topY + 22} C90 ${topY + 26} 92 ${topY + 32} 90 ${topY + 38}`} strokeWidth="1.8"/>
        </g>
    )
}

function MangoGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4" fill="#7a9f4a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.6" fill="#9ac05c" opacity="0.9"/>
            <path d="M18 95 L16 90 M22 95 L23 90 M26 95 L25 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L80 90 M82 95 L81 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <MangoFruit cx={22} cy={96} r={2}/>
            <MangoFruit cx={78} cy={96} r={1.8}/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <MangoGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#5c3a1e" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#5c3a1e" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#5c3a1e" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <MangoCluster cx={36} cy={62} radius={6} seed={1} count={10}/>
            <MangoCluster cx={64} cy={58} radius={6} seed={2} count={10}/>
            <MangoCluster cx={50} cy={54} radius={7} seed={3} count={12}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <MangoGround />
            <MangoTrunk topY={30}/>
            <MangoBranches topY={30}/>

            <MangoCluster cx={14} cy={34} radius={10} seed={10} count={16}/>
            <MangoCluster cx={86} cy={34} radius={10} seed={11} count={16}/>
            <MangoCluster cx={18} cy={18} radius={9} seed={12} count={14}/>
            <MangoCluster cx={82} cy={18} radius={9} seed={13} count={14}/>
            <MangoCluster cx={50} cy={14} radius={10} seed={14} count={16}/>
            <MangoCluster cx={50} cy={28} radius={10} seed={15} count={16}/>
            <MangoCluster cx={30} cy={30} radius={9} seed={16} count={14}/>
            <MangoCluster cx={70} cy={30} radius={9} seed={17} count={14}/>
            <MangoCluster cx={16} cy={50} radius={9} seed={18} count={14}/>
            <MangoCluster cx={84} cy={50} radius={9} seed={19} count={14}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="mangoAura" color1="#ffa726" color2="#3e7a1e" />
            <circle cx="50" cy="45" r="46" fill="url(#mangoAura)" />
            <MangoGround />
            <MangoTrunk topY={14}/>
            <MangoBranches topY={14}/>

            <MangoCluster cx={10} cy={16} radius={11} seed={100} count={18}/>
            <MangoCluster cx={90} cy={16} radius={11} seed={101} count={18}/>
            <MangoCluster cx={6} cy={34} radius={10} seed={102} count={16}/>
            <MangoCluster cx={94} cy={34} radius={10} seed={103} count={16}/>
            <MangoCluster cx={10} cy={52} radius={10} seed={104} count={16}/>
            <MangoCluster cx={90} cy={52} radius={10} seed={105} count={16}/>
            <MangoCluster cx={22} cy={4} radius={10} seed={106} count={16}/>
            <MangoCluster cx={78} cy={4} radius={10} seed={107} count={16}/>
            <MangoCluster cx={50} cy={-2} radius={11} seed={108} count={18}/>
            <MangoCluster cx={50} cy={14} radius={12} seed={109} count={20}/>
            <MangoCluster cx={50} cy={30} radius={11} seed={110} count={18}/>
            <MangoCluster cx={50} cy={46} radius={10} seed={111} count={16}/>
            <MangoCluster cx={30} cy={16} radius={10} seed={112} count={16}/>
            <MangoCluster cx={70} cy={16} radius={10} seed={113} count={16}/>
            <MangoCluster cx={28} cy={36} radius={10} seed={114} count={16}/>
            <MangoCluster cx={72} cy={36} radius={10} seed={115} count={16}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}