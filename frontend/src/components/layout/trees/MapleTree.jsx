import { Aura, SparkleRing, seededRandom } from './common'

const MAPLE_TONES = {
    red:    { fill: '#d32f2f', edge: '#8b0000', vein: '#5a0000' },
    orange: { fill: '#ff6f00', edge: '#b34700', vein: '#7a2e00' },
    amber:  { fill: '#ffa726', edge: '#c77800', vein: '#8a5200' },
    gold:   { fill: '#ffca28', edge: '#c79a00', vein: '#8a6a00' },
    deep:   { fill: '#b71c1c', edge: '#7a0000', vein: '#4a0000' },
}

// Кленовый лист — 5 лопастей (звёздочка)
function MapleLeaf({ cx, cy, r = 4, rot = 0, tone = 'orange' }) {
    const c = MAPLE_TONES[tone] || MAPLE_TONES.orange
    const s = r
    // 5-лопастная форма
    const d = `M${cx} ${cy - s * 1.3}
        L${cx + s * 0.35} ${cy - s * 0.5}
        L${cx + s * 1.1} ${cy - s * 0.7}
        L${cx + s * 0.5} ${cy}
        L${cx + s * 1} ${cy + s * 0.6}
        L${cx + s * 0.25} ${cy + s * 0.4}
        L${cx} ${cy + s * 1.2}
        L${cx - s * 0.25} ${cy + s * 0.4}
        L${cx - s * 1} ${cy + s * 0.6}
        L${cx - s * 0.5} ${cy}
        L${cx - s * 1.1} ${cy - s * 0.7}
        L${cx - s * 0.35} ${cy - s * 0.5} Z`
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={d} fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08} strokeLinejoin="round"/>
            {/* Центральная жилка */}
            <line x1={cx} y1={cy - s * 1.1} x2={cx} y2={cy + s * 1.05}
                  stroke={c.vein} strokeWidth={s * 0.08} opacity="0.6"/>
            {/* Боковые жилки */}
            <line x1={cx} y1={cy - s * 0.2} x2={cx + s * 0.9} y2={cy - s * 0.6}
                  stroke={c.vein} strokeWidth={s * 0.06} opacity="0.5"/>
            <line x1={cx} y1={cy - s * 0.2} x2={cx - s * 0.9} y2={cy - s * 0.6}
                  stroke={c.vein} strokeWidth={s * 0.06} opacity="0.5"/>
            <line x1={cx} y1={cy + s * 0.2} x2={cx + s * 0.8} y2={cy + s * 0.55}
                  stroke={c.vein} strokeWidth={s * 0.06} opacity="0.5"/>
            <line x1={cx} y1={cy + s * 0.2} x2={cx - s * 0.8} y2={cy + s * 0.55}
                  stroke={c.vein} strokeWidth={s * 0.06} opacity="0.5"/>
        </g>
    )
}

function MapleCluster({ cx, cy, radius = 9, count = 14, seed = 0 }) {
    const items = []
    const tones = ['red', 'orange', 'amber', 'gold', 'deep', 'orange']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <MapleLeaf key={i} cx={lx} cy={ly}
                       r={3 + seededRandom(seed, i + 200) * 1.2}
                       rot={seededRandom(seed, i + 300) * 360}
                       tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// Прямой ствол с корой
function MapleTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C48 84 52 70 50 56 C48 42 52 30 50 ${topY}`}
                  stroke="#6b4423" strokeWidth="8" strokeLinecap="round" fill="none"/>
            {/* Светлая сторона */}
            <path d={`M47 90 C45 80 49 68 47 56`}
                  stroke="#8a5c32" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* Тёмная сторона */}
            <path d={`M53 86 C53 76 51 68 52 58`}
                  stroke="#3a2412" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6"/>
            {/* Кора — трещины */}
            <path d="M45 76 C44 70 46 64 48 60" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M53 64 C52 58 53 52 52 46" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M48 40 C48 36 49 32 50 28" stroke="#2f1d14" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

// Раскидистые ветки
function MapleBranches({ topY = 16 }) {
    return (
        <g stroke="#6b4423" strokeLinecap="round" fill="none">
            {/* Верхние */}
            <path d={`M50 ${topY + 4} C42 ${topY - 4} 34 ${topY - 8} 26 ${topY - 4}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY + 4} C58 ${topY - 4} 66 ${topY - 8} 74 ${topY - 4}`} strokeWidth="3.4"/>

            {/* Средние */}
            <path d={`M50 ${topY + 16} C38 ${topY + 10} 24 ${topY + 8} 12 ${topY + 14}`} strokeWidth="4"/>
            <path d={`M50 ${topY + 16} C62 ${topY + 10} 76 ${topY + 8} 88 ${topY + 14}`} strokeWidth="4"/>

            {/* Нижние */}
            <path d={`M50 ${topY + 30} C40 ${topY + 26} 28 ${topY + 28} 18 ${topY + 36}`} strokeWidth="3.2"/>
            <path d={`M50 ${topY + 30} C60 ${topY + 26} 72 ${topY + 28} 82 ${topY + 36}`} strokeWidth="3.2"/>

            {/* Тонкие подветки */}
            <path d={`M26 ${topY - 4} C20 ${topY - 10} 14 ${topY - 12} 8 ${topY - 8}`} strokeWidth="2"/>
            <path d={`M74 ${topY - 4} C80 ${topY - 10} 86 ${topY - 12} 92 ${topY - 8}`} strokeWidth="2"/>
            <path d={`M12 ${topY + 14} C6 ${topY + 18} 4 ${topY + 24} 6 ${topY + 30}`} strokeWidth="1.8"/>
            <path d={`M88 ${topY + 14} C94 ${topY + 18} 96 ${topY + 24} 94 ${topY + 30}`} strokeWidth="1.8"/>
        </g>
    )
}

function MapleGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4" fill="#6b5a3a" opacity="0.75"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.6" fill="#8a7550" opacity="0.85"/>
            <path d="M18 95 L16 90 M22 95 L23 90 M26 95 L25 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L80 90 M82 95 L81 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            {/* Опавшие листья — осенние */}
            <MapleLeaf cx={22} cy={95} r={2} rot={20} tone="red"/>
            <MapleLeaf cx={34} cy={96} r={1.8} rot={-30} tone="orange"/>
            <MapleLeaf cx={66} cy={96} r={2} rot={45} tone="amber"/>
            <MapleLeaf cx={78} cy={95} r={1.8} rot={-15} tone="deep"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <MapleGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#6b4423" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#6b4423" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#6b4423" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <MapleCluster cx={36} cy={62} radius={6} seed={1} count={10}/>
            <MapleCluster cx={64} cy={58} radius={6} seed={2} count={10}/>
            <MapleCluster cx={50} cy={54} radius={7} seed={3} count={12}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <MapleGround />
            <MapleTrunk topY={30}/>
            <MapleBranches topY={30}/>

            <MapleCluster cx={8} cy={22} radius={10} seed={10} count={16}/>
            <MapleCluster cx={92} cy={22} radius={10} seed={11} count={16}/>
            <MapleCluster cx={14} cy={40} radius={10} seed={12} count={16}/>
            <MapleCluster cx={86} cy={40} radius={10} seed={13} count={16}/>
            <MapleCluster cx={26} cy={20} radius={9} seed={14} count={14}/>
            <MapleCluster cx={74} cy={20} radius={9} seed={15} count={14}/>
            <MapleCluster cx={50} cy={18} radius={10} seed={16} count={16}/>
            <MapleCluster cx={50} cy={34} radius={10} seed={17} count={16}/>
            <MapleCluster cx={30} cy={36} radius={9} seed={18} count={14}/>
            <MapleCluster cx={70} cy={36} radius={9} seed={19} count={14}/>
            <MapleCluster cx={20} cy={54} radius={9} seed={20} count={14}/>
            <MapleCluster cx={80} cy={54} radius={9} seed={21} count={14}/>
            <MapleCluster cx={50} cy={50} radius={9} seed={22} count={14}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="mapleAura" color1="#ffa726" color2="#d32f2f" />
            <circle cx="50" cy="45" r="48" fill="url(#mapleAura)" />
            <MapleGround />
            <MapleTrunk topY={14}/>
            <MapleBranches topY={14}/>

            {/* Широкий плотный купол */}
            <MapleCluster cx={6} cy={16} radius={11} seed={100} count={18}/>
            <MapleCluster cx={94} cy={16} radius={11} seed={101} count={18}/>
            <MapleCluster cx={10} cy={32} radius={11} seed={102} count={18}/>
            <MapleCluster cx={90} cy={32} radius={11} seed={103} count={18}/>
            <MapleCluster cx={8} cy={50} radius={11} seed={104} count={18}/>
            <MapleCluster cx={92} cy={50} radius={11} seed={105} count={18}/>
            <MapleCluster cx={18} cy={-2} radius={10} seed={106} count={16}/>
            <MapleCluster cx={82} cy={-2} radius={10} seed={107} count={16}/>
            <MapleCluster cx={40} cy={-6} radius={10} seed={108} count={16}/>
            <MapleCluster cx={60} cy={-6} radius={10} seed={109} count={16}/>
            <MapleCluster cx={50} cy={8} radius={12} seed={110} count={20}/>
            <MapleCluster cx={50} cy={24} radius={12} seed={111} count={20}/>
            <MapleCluster cx={50} cy={40} radius={11} seed={112} count={18}/>
            <MapleCluster cx={28} cy={12} radius={10} seed={113} count={16}/>
            <MapleCluster cx={72} cy={12} radius={10} seed={114} count={16}/>
            <MapleCluster cx={26} cy={28} radius={10} seed={115} count={16}/>
            <MapleCluster cx={74} cy={28} radius={10} seed={116} count={16}/>
            <MapleCluster cx={14} cy={58} radius={10} seed={117} count={16}/>
            <MapleCluster cx={86} cy={58} radius={10} seed={118} count={16}/>
            <MapleCluster cx={32} cy={48} radius={9} seed={119} count={14}/>
            <MapleCluster cx={68} cy={48} radius={9} seed={120} count={14}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}