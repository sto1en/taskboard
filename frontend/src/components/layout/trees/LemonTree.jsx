import { Aura, SparkleRing, seededRandom } from './common'

// Мелкий лист лимона
function LemonLeaf({ cx, cy, r = 3, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#7cb342', vein: '#5a8f28', edge: '#4a7a20' },
        mid:   { fill: '#4e8a24', vein: '#2f6b22', edge: '#255c1a' },
        deep:  { fill: '#3a6e18', vein: '#1f4a10', edge: '#163808' },
    }
    const c = palette[tone] || palette.mid
    const s = r
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - s * 1.3}
                     C${cx + s * 0.85} ${cy - s * 1} ${cx + s * 1} ${cy - s * 0.2} ${cx + s * 0.55} ${cy + s * 0.5}
                     C${cx + s * 0.3} ${cy + s * 1} ${cx + s * 0.05} ${cy + s * 1.2} ${cx} ${cy + s * 1.3}
                     C${cx - s * 0.05} ${cy + s * 1.2} ${cx - s * 0.3} ${cy + s * 1} ${cx - s * 0.55} ${cy + s * 0.5}
                     C${cx - s * 1} ${cy - s * 0.2} ${cx - s * 0.85} ${cy - s * 1} ${cx} ${cy - s * 1.3} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            <line x1={cx} y1={cy - s * 1.1} x2={cx} y2={cy + s * 1.1}
                  stroke={c.vein} strokeWidth={s * 0.1} opacity="0.7"/>
        </g>
    )
}

// Лимон — жёлтый овал с «носиками»
function LemonFruit({ cx, cy, r = 3.5 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx={r * 0.85} ry={r * 1.15} fill="#ffeb3b"/>
            {/* Тёмная сторона */}
            <ellipse cx={cx + r * 0.2} cy={cy + r * 0.2} rx={r * 0.55} ry={r * 0.8}
                     fill="#f9a825" opacity="0.7"/>
            {/* Блик */}
            <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.2} ry={r * 0.35}
                     fill="#fffde7" opacity="0.9"/>
            {/* Носик сверху */}
            <circle cx={cx} cy={cy - r * 1.1} r={r * 0.15} fill="#c8a415"/>
            {/* Носик снизу */}
            <circle cx={cx} cy={cy + r * 1.1} r={r * 0.15} fill="#c8a415"/>
        </g>
    )
}

function LemonCluster({ cx, cy, radius = 8, count = 14, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <LemonLeaf key={i} cx={lx} cy={ly}
                       r={2.4 + seededRandom(seed, i + 200) * 0.9}
                       rot={seededRandom(seed, i + 300) * 360}
                       tone={tones[i % tones.length]}/>
        )
    }
    // Яркие лимоны — много
    if (seededRandom(seed, 400) > 0.3) {
        items.push(
            <LemonFruit key="l1" cx={cx + radius * 0.25} cy={cy + radius * 0.3}
                        r={2.4 + seededRandom(seed, 500) * 0.8}/>
        )
    }
    if (seededRandom(seed, 600) > 0.5) {
        items.push(
            <LemonFruit key="l2" cx={cx - radius * 0.35} cy={cy + radius * 0.1}
                        r={2.2 + seededRandom(seed, 700) * 0.7}/>
        )
    }
    if (seededRandom(seed, 800) > 0.65) {
        items.push(
            <LemonFruit key="l3" cx={cx + radius * 0.4} cy={cy - radius * 0.2}
                        r={2 + seededRandom(seed, 900) * 0.6}/>
        )
    }
    return <g>{items}</g>
}

function LemonTrunk({ topY = 22 }) {
    return (
        <g>
            <path d={`M50 96 C49 86 51 74 50 62 C49 50 51 38 50 ${topY}`}
                  stroke="#4a3018" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <path d={`M47 90 C46 82 49 72 48 62`}
                  stroke="#6b4a2b" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M52 84 C52 76 53 68 51 58"
                  stroke="#2a1a08" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

function LemonBranches({ topY = 20 }) {
    return (
        <g stroke="#4a3018" strokeLinecap="round" fill="none">
            <path d={`M50 ${topY + 4} C42 ${topY - 2} 34 ${topY} 26 ${topY + 6}`} strokeWidth="2.8"/>
            <path d={`M50 ${topY + 4} C58 ${topY - 2} 66 ${topY} 74 ${topY + 6}`} strokeWidth="2.8"/>

            <path d={`M50 ${topY + 14} C40 ${topY + 10} 28 ${topY + 12} 18 ${topY + 20}`} strokeWidth="3"/>
            <path d={`M50 ${topY + 14} C60 ${topY + 10} 72 ${topY + 12} 82 ${topY + 20}`} strokeWidth="3"/>

            <path d={`M50 ${topY + 26} C42 ${topY + 24} 30 ${topY + 28} 22 ${topY + 36}`} strokeWidth="2.6"/>
            <path d={`M50 ${topY + 26} C58 ${topY + 24} 70 ${topY + 28} 78 ${topY + 36}`} strokeWidth="2.6"/>

            <path d={`M26 ${topY + 6} C20 ${topY + 2} 16 ${topY} 14 ${topY - 4}`} strokeWidth="1.6"/>
            <path d={`M74 ${topY + 6} C80 ${topY + 2} 84 ${topY} 86 ${topY - 4}`} strokeWidth="1.6"/>

            <path d={`M18 ${topY + 20} C14 ${topY + 24} 12 ${topY + 30} 14 ${topY + 36}`} strokeWidth="1.5"/>
            <path d={`M82 ${topY + 20} C86 ${topY + 24} 88 ${topY + 30} 86 ${topY + 36}`} strokeWidth="1.5"/>
        </g>
    )
}

function LemonGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="38" ry="4" fill="#6b8f3a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="28" ry="2.6" fill="#8aad4a" opacity="0.9"/>
            <path d="M22 95 L20 90 M26 95 L27 90 M30 95 L29 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M70 95 L71 90 M74 95 L76 90 M78 95 L77 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <LemonFruit cx={26} cy={96} r={1.6}/>
            <LemonFruit cx={74} cy={96} r={1.8}/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <LemonGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#4a3018" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#4a3018" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#4a3018" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <LemonCluster cx={36} cy={62} radius={5} seed={1} count={9}/>
            <LemonCluster cx={64} cy={58} radius={5} seed={2} count={9}/>
            <LemonCluster cx={50} cy={54} radius={6} seed={3} count={11}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <LemonGround />
            <LemonTrunk topY={30}/>
            <LemonBranches topY={30}/>

            <LemonCluster cx={20} cy={28} radius={8} seed={10} count={13}/>
            <LemonCluster cx={80} cy={28} radius={8} seed={11} count={13}/>
            <LemonCluster cx={22} cy={14} radius={7} seed={12} count={11}/>
            <LemonCluster cx={78} cy={14} radius={7} seed={13} count={11}/>
            <LemonCluster cx={50} cy={12} radius={8} seed={14} count={13}/>
            <LemonCluster cx={50} cy={26} radius={8} seed={15} count={13}/>
            <LemonCluster cx={34} cy={28} radius={7} seed={16} count={11}/>
            <LemonCluster cx={66} cy={28} radius={7} seed={17} count={11}/>
            <LemonCluster cx={20} cy={48} radius={7} seed={18} count={11}/>
            <LemonCluster cx={80} cy={48} radius={7} seed={19} count={11}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="lemonAura" color1="#fff59d" color2="#4e8a24" />
            <circle cx="50" cy="45" r="46" fill="url(#lemonAura)" />
            <LemonGround />
            <LemonTrunk topY={14}/>
            <LemonBranches topY={14}/>

            <LemonCluster cx={14} cy={22} radius={9} seed={100} count={15}/>
            <LemonCluster cx={86} cy={22} radius={9} seed={101} count={15}/>
            <LemonCluster cx={10} cy={38} radius={9} seed={102} count={15}/>
            <LemonCluster cx={90} cy={38} radius={9} seed={103} count={15}/>
            <LemonCluster cx={14} cy={54} radius={8} seed={104} count={13}/>
            <LemonCluster cx={86} cy={54} radius={8} seed={105} count={13}/>
            <LemonCluster cx={26} cy={6} radius={8} seed={106} count={13}/>
            <LemonCluster cx={74} cy={6} radius={8} seed={107} count={13}/>
            <LemonCluster cx={50} cy={0} radius={9} seed={108} count={15}/>
            <LemonCluster cx={50} cy={14} radius={10} seed={109} count={16}/>
            <LemonCluster cx={50} cy={30} radius={9} seed={110} count={15}/>
            <LemonCluster cx={30} cy={22} radius={9} seed={111} count={15}/>
            <LemonCluster cx={70} cy={22} radius={9} seed={112} count={15}/>
            <LemonCluster cx={28} cy={40} radius={8} seed={113} count={13}/>
            <LemonCluster cx={72} cy={40} radius={8} seed={114} count={13}/>
            <LemonCluster cx={50} cy={46} radius={8} seed={115} count={13}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}