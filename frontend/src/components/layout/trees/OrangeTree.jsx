import { Aura, SparkleRing, seededRandom } from './common'

// Блестящий лист апельсина (тёмный, глянцевый)
function OrangeLeaf({ cx, cy, r = 4, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#4a9f2a', vein: '#2a6a14', edge: '#1f5010' },
        mid:   { fill: '#2f7a1a', vein: '#1a5510', edge: '#12400c' },
        deep:  { fill: '#1f5c0f', vein: '#0f3a08', edge: '#0a2a06' },
    }
    const c = palette[tone] || palette.mid
    const s = r
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - s * 1.4}
                     C${cx + s * 0.9} ${cy - s * 1.1} ${cx + s * 1.1} ${cy - s * 0.2} ${cx + s * 0.6} ${cy + s * 0.6}
                     C${cx + s * 0.3} ${cy + s * 1.1} ${cx + s * 0.05} ${cy + s * 1.3} ${cx} ${cy + s * 1.4}
                     C${cx - s * 0.05} ${cy + s * 1.3} ${cx - s * 0.3} ${cy + s * 1.1} ${cx - s * 0.6} ${cy + s * 0.6}
                     C${cx - s * 1.1} ${cy - s * 0.2} ${cx - s * 0.9} ${cy - s * 1.1} ${cx} ${cy - s * 1.4} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            <line x1={cx} y1={cy - s * 1.2} x2={cx} y2={cy + s * 1.2}
                  stroke={c.vein} strokeWidth={s * 0.1} opacity="0.7"/>
            {/* Блеск */}
            <ellipse cx={cx - s * 0.3} cy={cy - s * 0.5}
                     rx={s * 0.3} ry={s * 0.15}
                     fill="#ffffff" opacity="0.35"/>
        </g>
    )
}

// Апельсин — оранжевый шар с блеском
function OrangeFruit({ cx, cy, r = 4 }) {
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="#ff6f00"/>
            <circle cx={cx + r * 0.2} cy={cy + r * 0.3} r={r * 0.75}
                    fill="#e65100" opacity="0.6"/>
            <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.3} fill="#ffb74d" opacity="0.85"/>
            <circle cx={cx - r * 0.4} cy={cy - r * 0.5} r={r * 0.12} fill="#fff3e0" opacity="0.95"/>
            <line x1={cx} y1={cy - r} x2={cx} y2={cy - r * 1.3}
                  stroke="#4d3a2a" strokeWidth={r * 0.12} strokeLinecap="round"/>
            <ellipse cx={cx + r * 0.3} cy={cy - r * 1.2} rx={r * 0.4} ry={r * 0.2}
                     fill="#4a9f2a" opacity="0.9"/>
        </g>
    )
}

function OrangeCluster({ cx, cy, radius = 9, count = 14, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <OrangeLeaf key={i} cx={lx} cy={ly}
                        r={3 + seededRandom(seed, i + 200) * 1.1}
                        rot={seededRandom(seed, i + 300) * 360}
                        tone={tones[i % tones.length]}/>
        )
    }
    // Яркие апельсины — много
    if (seededRandom(seed, 400) > 0.3) {
        items.push(
            <OrangeFruit key="o1" cx={cx + radius * 0.2} cy={cy + radius * 0.3}
                         r={2.6 + seededRandom(seed, 500) * 0.8}/>
        )
    }
    if (seededRandom(seed, 600) > 0.5) {
        items.push(
            <OrangeFruit key="o2" cx={cx - radius * 0.4} cy={cy + radius * 0.1}
                         r={2.4 + seededRandom(seed, 700) * 0.7}/>
        )
    }
    if (seededRandom(seed, 800) > 0.7) {
        items.push(
            <OrangeFruit key="o3" cx={cx + radius * 0.4} cy={cy - radius * 0.2}
                         r={2.2 + seededRandom(seed, 900) * 0.6}/>
        )
    }
    return <g>{items}</g>
}

function OrangeTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C49 84 51 72 50 60 C49 48 51 36 50 ${topY}`}
                  stroke="#4a3018" strokeWidth="7" strokeLinecap="round" fill="none"/>
            <path d={`M47 90 C46 80 49 70 48 60`}
                  stroke="#6b4a2b" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M52 82 C52 74 53 66 51 58"
                  stroke="#2a1a08" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M46 76 C45 70 47 64 48 60"
                  stroke="#2a1a08" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

function OrangeBranches({ topY = 18 }) {
    return (
        <g stroke="#4a3018" strokeLinecap="round" fill="none">
            <path d={`M50 ${topY + 4} C42 ${topY - 2} 34 ${topY} 26 ${topY + 6}`} strokeWidth="3"/>
            <path d={`M50 ${topY + 4} C58 ${topY - 2} 66 ${topY} 74 ${topY + 6}`} strokeWidth="3"/>

            <path d={`M50 ${topY + 16} C40 ${topY + 12} 26 ${topY + 14} 16 ${topY + 22}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY + 16} C60 ${topY + 12} 74 ${topY + 14} 84 ${topY + 22}`} strokeWidth="3.4"/>

            <path d={`M50 ${topY + 30} C40 ${topY + 28} 28 ${topY + 32} 20 ${topY + 42}`} strokeWidth="2.8"/>
            <path d={`M50 ${topY + 30} C60 ${topY + 28} 72 ${topY + 32} 80 ${topY + 42}`} strokeWidth="2.8"/>

            <path d={`M26 ${topY + 6} C20 ${topY + 2} 16 ${topY - 2} 16 ${topY - 6}`} strokeWidth="1.8"/>
            <path d={`M74 ${topY + 6} C80 ${topY + 2} 84 ${topY - 2} 84 ${topY - 6}`} strokeWidth="1.8"/>

            <path d={`M16 ${topY + 22} C12 ${topY + 26} 10 ${topY + 32} 12 ${topY + 38}`} strokeWidth="1.6"/>
            <path d={`M84 ${topY + 22} C88 ${topY + 26} 90 ${topY + 32} 88 ${topY + 38}`} strokeWidth="1.6"/>
        </g>
    )
}

function OrangeGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="40" ry="4" fill="#5a7a2a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="30" ry="2.6" fill="#7a9a3a" opacity="0.9"/>
            <path d="M20 95 L18 90 M24 95 L25 90 M28 95 L27 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M72 95 L73 90 M76 95 L78 90 M80 95 L79 90"
                  stroke="#4e8a3a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <OrangeFruit cx={24} cy={96} r={1.8}/>
            <OrangeFruit cx={76} cy={96} r={1.6}/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <OrangeGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#4a3018" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#4a3018" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#4a3018" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <OrangeCluster cx={36} cy={62} radius={6} seed={1} count={10}/>
            <OrangeCluster cx={64} cy={58} radius={6} seed={2} count={10}/>
            <OrangeCluster cx={50} cy={54} radius={7} seed={3} count={12}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <OrangeGround />
            <OrangeTrunk topY={30}/>
            <OrangeBranches topY={30}/>

            <OrangeCluster cx={20} cy={28} radius={9} seed={10} count={14}/>
            <OrangeCluster cx={80} cy={28} radius={9} seed={11} count={14}/>
            <OrangeCluster cx={22} cy={14} radius={8} seed={12} count={12}/>
            <OrangeCluster cx={78} cy={14} radius={8} seed={13} count={12}/>
            <OrangeCluster cx={50} cy={12} radius={9} seed={14} count={14}/>
            <OrangeCluster cx={50} cy={26} radius={9} seed={15} count={14}/>
            <OrangeCluster cx={34} cy={28} radius={8} seed={16} count={12}/>
            <OrangeCluster cx={66} cy={28} radius={8} seed={17} count={12}/>
            <OrangeCluster cx={18} cy={48} radius={8} seed={18} count={12}/>
            <OrangeCluster cx={82} cy={48} radius={8} seed={19} count={12}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="orangeAura" color1="#ffa726" color2="#2f7a1a" />
            <circle cx="50" cy="45" r="46" fill="url(#orangeAura)" />
            <OrangeGround />
            <OrangeTrunk topY={14}/>
            <OrangeBranches topY={14}/>

            {/* Плотная крона — 18 кластеров */}
            <OrangeCluster cx={14} cy={22} radius={10} seed={100} count={16}/>
            <OrangeCluster cx={86} cy={22} radius={10} seed={101} count={16}/>
            <OrangeCluster cx={10} cy={40} radius={10} seed={102} count={16}/>
            <OrangeCluster cx={90} cy={40} radius={10} seed={103} count={16}/>
            <OrangeCluster cx={14} cy={56} radius={9} seed={104} count={14}/>
            <OrangeCluster cx={86} cy={56} radius={9} seed={105} count={14}/>
            <OrangeCluster cx={26} cy={6} radius={9} seed={106} count={14}/>
            <OrangeCluster cx={74} cy={6} radius={9} seed={107} count={14}/>
            <OrangeCluster cx={50} cy={0} radius={10} seed={108} count={16}/>
            <OrangeCluster cx={50} cy={14} radius={11} seed={109} count={18}/>
            <OrangeCluster cx={50} cy={30} radius={10} seed={110} count={16}/>
            <OrangeCluster cx={30} cy={22} radius={10} seed={111} count={16}/>
            <OrangeCluster cx={70} cy={22} radius={10} seed={112} count={16}/>
            <OrangeCluster cx={28} cy={40} radius={9} seed={113} count={14}/>
            <OrangeCluster cx={72} cy={40} radius={9} seed={114} count={14}/>
            <OrangeCluster cx={50} cy={48} radius={9} seed={115} count={14}/>
            <OrangeCluster cx={18} cy={6} radius={8} seed={116} count={12}/>
            <OrangeCluster cx={82} cy={6} radius={8} seed={117} count={12}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}