import { Aura, SparkleRing, seededRandom } from './common'

// Серо-голубой лист эвкалипта — узкий серп
function EucalyptusLeaf({ cx, cy, size = 4, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#b8c8d4', vein: '#8a9aa8', edge: '#7a8a98' },
        mid:   { fill: '#8a9fae', vein: '#5a6f80', edge: '#4a5f70' },
        deep:  { fill: '#5a7080', vein: '#3a4f60', edge: '#2a3f50' },
    }
    const c = palette[tone] || palette.mid
    const s = size
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - s * 1.8}
                     C${cx + s * 0.7} ${cy - s * 1} ${cx + s * 0.8} ${cy + s * 0.3} ${cx} ${cy + s * 1.8}
                     C${cx - s * 0.8} ${cy + s * 0.3} ${cx - s * 0.7} ${cy - s * 1} ${cx} ${cy - s * 1.8} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            <line x1={cx} y1={cy - s * 1.5} x2={cx} y2={cy + s * 1.5}
                  stroke={c.vein} strokeWidth={s * 0.08} opacity="0.6"/>
        </g>
    )
}

function EucalyptusCluster({ cx, cy, radius = 8, count = 12, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <EucalyptusLeaf key={i} cx={lx} cy={ly}
                            size={2.4 + seededRandom(seed, i + 200) * 1}
                            rot={seededRandom(seed, i + 300) * 360}
                            tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// Светлый ствол с отслаивающейся корой
function EucalyptusTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C48 86 52 74 50 62 C48 50 52 38 50 ${topY}`}
                  stroke="#b8a894" strokeWidth="7" strokeLinecap="round" fill="none"/>
            <path d={`M47 90 C46 82 49 72 48 62`}
                  stroke="#d4c4b0" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M52 84 C52 76 53 68 51 60"
                  stroke="#8a7a66" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
            {/* Отслаивающиеся пятна */}
            <ellipse cx={46} cy={78} rx={1.5} ry={0.7} fill="#9a8a76" opacity="0.7"/>
            <ellipse cx={53} cy={68} rx={1.4} ry={0.6} fill="#9a8a76" opacity="0.7"/>
            <ellipse cx={47} cy={56} rx={1.3} ry={0.6} fill="#9a8a76" opacity="0.7"/>
            <ellipse cx={52} cy={44} rx={1.2} ry={0.5} fill="#9a8a76" opacity="0.6"/>
        </g>
    )
}

// Тонкие длинные ветки, висящие вниз
function EucalyptusBranches({ topY = 18 }) {
    return (
        <g stroke="#b8a894" strokeLinecap="round" fill="none">
            <path d={`M50 ${topY + 4} C42 ${topY} 32 ${topY} 22 ${topY + 6}`} strokeWidth="2.6"/>
            <path d={`M50 ${topY + 4} C58 ${topY} 68 ${topY} 78 ${topY + 6}`} strokeWidth="2.6"/>

            <path d={`M50 ${topY + 14} C40 ${topY + 10} 28 ${topY + 14} 18 ${topY + 22}`} strokeWidth="3"/>
            <path d={`M50 ${topY + 14} C60 ${topY + 10} 72 ${topY + 14} 82 ${topY + 22}`} strokeWidth="3"/>

            <path d={`M50 ${topY + 28} C40 ${topY + 26} 30 ${topY + 30} 22 ${topY + 40}`} strokeWidth="2.6"/>
            <path d={`M50 ${topY + 28} C60 ${topY + 26} 70 ${topY + 30} 78 ${topY + 40}`} strokeWidth="2.6"/>

            {/* Свисающие тонкие ветки — фишка эвкалипта */}
            <path d={`M22 ${topY + 6} C20 ${topY + 16} 20 ${topY + 26} 22 ${topY + 36}`} strokeWidth="1.6"/>
            <path d={`M78 ${topY + 6} C80 ${topY + 16} 80 ${topY + 26} 78 ${topY + 36}`} strokeWidth="1.6"/>

            <path d={`M18 ${topY + 22} C14 ${topY + 30} 14 ${topY + 38} 16 ${topY + 46}`} strokeWidth="1.4"/>
            <path d={`M82 ${topY + 22} C86 ${topY + 30} 86 ${topY + 38} 84 ${topY + 46}`} strokeWidth="1.4"/>

            <path d={`M22 ${topY + 40} C18 ${topY + 48} 16 ${topY + 56} 18 ${topY + 64}`} strokeWidth="1.2"/>
            <path d={`M78 ${topY + 40} C82 ${topY + 48} 84 ${topY + 56} 82 ${topY + 64}`} strokeWidth="1.2"/>
        </g>
    )
}

function EucalyptusGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4" fill="#8a7a66" opacity="0.75"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.6" fill="#a89a84" opacity="0.85"/>
            <path d="M18 95 L16 90 M22 95 L23 90 M26 95 L25 90"
                  stroke="#7a8a4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L80 90 M82 95 L81 90"
                  stroke="#7a8a4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            {/* Опавшие листья */}
            <ellipse cx={24} cy={95} rx={1.2} ry={0.6} fill="#8a9fae" opacity="0.8"/>
            <ellipse cx={36} cy={96} rx={1} ry={0.5} fill="#b8c8d4" opacity="0.75"/>
            <ellipse cx={64} cy={96} rx={1.1} ry={0.6} fill="#5a7080" opacity="0.8"/>
            <ellipse cx={76} cy={95} rx={1.2} ry={0.6} fill="#8a9fae" opacity="0.75"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <EucalyptusGround />
            <path d="M50 94 C49 84 51 74 50 62" stroke="#b8a894" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C44 76 40 72 38 66" stroke="#b8a894" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C56 72 60 68 62 62" stroke="#b8a894" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <EucalyptusCluster cx={38} cy={64} radius={5} seed={1} count={8}/>
            <EucalyptusCluster cx={62} cy={60} radius={5} seed={2} count={8}/>
            <EucalyptusCluster cx={50} cy={54} radius={6} seed={3} count={10}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <EucalyptusGround />
            <EucalyptusTrunk topY={30}/>
            <EucalyptusBranches topY={30}/>

            <EucalyptusCluster cx={22} cy={30} radius={8} seed={10} count={12}/>
            <EucalyptusCluster cx={78} cy={30} radius={8} seed={11} count={12}/>
            <EucalyptusCluster cx={18} cy={46} radius={7} seed={12} count={11}/>
            <EucalyptusCluster cx={82} cy={46} radius={7} seed={13} count={11}/>
            <EucalyptusCluster cx={20} cy={60} radius={7} seed={14} count={11}/>
            <EucalyptusCluster cx={80} cy={60} radius={7} seed={15} count={11}/>
            <EucalyptusCluster cx={22} cy={76} radius={6} seed={16} count={9}/>
            <EucalyptusCluster cx={78} cy={76} radius={6} seed={17} count={9}/>
            <EucalyptusCluster cx={50} cy={26} radius={8} seed={18} count={12}/>
            <EucalyptusCluster cx={50} cy={42} radius={7} seed={19} count={11}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="eucalyptusAura" color1="#c8d8e0" color2="#5a7080" />
            <circle cx="50" cy="45" r="48" fill="url(#eucalyptusAura)" />
            <EucalyptusGround />
            <EucalyptusTrunk topY={14}/>
            <EucalyptusBranches topY={14}/>

            {/* Ажурная крона — листья по всей высоте дерева (фишка эвкалипта) */}
            <EucalyptusCluster cx={22} cy={12} radius={9} seed={100} count={14}/>
            <EucalyptusCluster cx={78} cy={12} radius={9} seed={101} count={14}/>
            <EucalyptusCluster cx={14} cy={28} radius={9} seed={102} count={14}/>
            <EucalyptusCluster cx={86} cy={28} radius={9} seed={103} count={14}/>
            <EucalyptusCluster cx={12} cy={44} radius={9} seed={104} count={14}/>
            <EucalyptusCluster cx={88} cy={44} radius={9} seed={105} count={14}/>
            <EucalyptusCluster cx={16} cy={60} radius={8} seed={106} count={12}/>
            <EucalyptusCluster cx={84} cy={60} radius={8} seed={107} count={12}/>
            <EucalyptusCluster cx={18} cy={76} radius={7} seed={108} count={11}/>
            <EucalyptusCluster cx={82} cy={76} radius={7} seed={109} count={11}/>
            <EucalyptusCluster cx={50} cy={10} radius={9} seed={110} count={14}/>
            <EucalyptusCluster cx={50} cy={24} radius={9} seed={111} count={14}/>
            <EucalyptusCluster cx={50} cy={40} radius={9} seed={112} count={14}/>
            <EucalyptusCluster cx={38} cy={20} radius={8} seed={113} count={12}/>
            <EucalyptusCluster cx={62} cy={20} radius={8} seed={114} count={12}/>
            <EucalyptusCluster cx={34} cy={50} radius={8} seed={115} count={12}/>
            <EucalyptusCluster cx={66} cy={50} radius={8} seed={116} count={12}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}