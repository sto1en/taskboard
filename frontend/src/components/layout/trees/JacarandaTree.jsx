import { Aura, SparkleRing, seededRandom } from './common'

const JACARANDA_TONES = {
    light: { petal: '#e1bee7', edge: '#ba68c8', core: '#fff59d' },
    mid:   { petal: '#ba68c8', edge: '#8e24aa', core: '#ffd54f' },
    deep:  { petal: '#9c27b0', edge: '#6a1b9a', core: '#ffb300' },
    blue:  { petal: '#9575cd', edge: '#512da8', core: '#ffca28' },
}

// Трубчатый цветок джакаранды
function JacarandaFlower({ cx, cy, r = 2.5, rot = 0, tone = 'mid' }) {
    const p = JACARANDA_TONES[tone] || JACARANDA_TONES.mid
    const petals = []
    // 5 лепестков, тонкие
    for (let i = 0; i < 5; i++) {
        const a = i * 72 + rot
        const rad = a * Math.PI / 180
        const px = cx + Math.cos(rad) * r * 0.55
        const py = cy + Math.sin(rad) * r * 0.55
        petals.push(
            <ellipse key={i} cx={px} cy={py} rx={r * 0.5} ry={r * 0.35}
                     transform={`rotate(${a} ${px} ${py})`}
                     fill={p.petal} stroke={p.edge} strokeWidth={r * 0.08}/>
        )
    }
    return (
        <g>
            {petals}
            <circle cx={cx} cy={cy} r={r * 0.2} fill={p.core}/>
        </g>
    )
}

function JacarandaCluster({ cx, cy, radius = 8, count = 18, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'blue', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <JacarandaFlower key={i} cx={lx} cy={ly}
                             r={1.8 + seededRandom(seed, i + 200) * 0.8}
                             rot={seededRandom(seed, i + 300) * 360}
                             tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// Ствол — светлый серо-коричневый, тонкий
function JacarandaTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C49 86 51 74 50 62 C49 50 51 38 50 ${topY}`}
                  stroke="#6b5544" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <path d={`M47.5 90 C46.5 82 49 72 48 62`}
                  stroke="#8a705a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M52 84 C52 76 53 68 51 60"
                  stroke="#4a3828" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

// Ажурные ветки — тонкие, извилистые
function JacarandaBranches({ topY = 18 }) {
    return (
        <g stroke="#6b5544" strokeLinecap="round" fill="none">
            <path d={`M50 ${topY + 4} C42 ${topY - 2} 32 ${topY - 4} 22 ${topY + 2}`} strokeWidth="2.6"/>
            <path d={`M50 ${topY + 4} C58 ${topY - 2} 68 ${topY - 4} 78 ${topY + 2}`} strokeWidth="2.6"/>

            <path d={`M50 ${topY + 14} C40 ${topY + 10} 28 ${topY + 12} 18 ${topY + 20}`} strokeWidth="3"/>
            <path d={`M50 ${topY + 14} C60 ${topY + 10} 72 ${topY + 12} 82 ${topY + 20}`} strokeWidth="3"/>

            <path d={`M50 ${topY + 28} C40 ${topY + 26} 28 ${topY + 30} 20 ${topY + 38}`} strokeWidth="2.6"/>
            <path d={`M50 ${topY + 28} C60 ${topY + 26} 72 ${topY + 30} 80 ${topY + 38}`} strokeWidth="2.6"/>

            {/* Тонкие веточки — извилистые */}
            <path d={`M22 ${topY + 2} C18 ${topY - 4} 14 ${topY - 6} 10 ${topY - 2}`} strokeWidth="1.6"/>
            <path d={`M78 ${topY + 2} C82 ${topY - 4} 86 ${topY - 6} 90 ${topY - 2}`} strokeWidth="1.6"/>

            <path d={`M18 ${topY + 20} C12 ${topY + 24} 8 ${topY + 30} 10 ${topY + 38}`} strokeWidth="1.6"/>
            <path d={`M82 ${topY + 20} C88 ${topY + 24} 92 ${topY + 30} 90 ${topY + 38}`} strokeWidth="1.6"/>

            <path d={`M10 ${topY - 2} C6 ${topY - 8} 4 ${topY - 10} 6 ${topY - 14}`} strokeWidth="1.2"/>
            <path d={`M90 ${topY - 2} C94 ${topY - 8} 96 ${topY - 10} 94 ${topY - 14}`} strokeWidth="1.2"/>

            <path d={`M20 ${topY + 38} C16 ${topY + 44} 14 ${topY + 50} 16 ${topY + 56}`} strokeWidth="1.2"/>
            <path d={`M80 ${topY + 38} C84 ${topY + 44} 86 ${topY + 50} 84 ${topY + 56}`} strokeWidth="1.2"/>
        </g>
    )
}

function JacarandaGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="40" ry="4" fill="#6b5a3a" opacity="0.75"/>
            <ellipse cx="50" cy="95" rx="30" ry="2.6" fill="#8a7550" opacity="0.85"/>
            <path d="M20 95 L18 90 M24 95 L25 90 M28 95 L27 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M72 95 L73 90 M76 95 L78 90 M80 95 L79 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            {/* Опавшие цветы */}
            <JacarandaFlower cx={24} cy={95} r={1.6} tone="mid"/>
            <JacarandaFlower cx={36} cy={96} r={1.5} tone="light"/>
            <JacarandaFlower cx={64} cy={96} r={1.6} tone="deep"/>
            <JacarandaFlower cx={76} cy={95} r={1.5} tone="blue"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <JacarandaGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#6b5544" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#6b5544" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#6b5544" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <JacarandaCluster cx={36} cy={62} radius={5} seed={1} count={12}/>
            <JacarandaCluster cx={64} cy={58} radius={5} seed={2} count={12}/>
            <JacarandaCluster cx={50} cy={54} radius={6} seed={3} count={14}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <JacarandaGround />
            <JacarandaTrunk topY={30}/>
            <JacarandaBranches topY={30}/>

            <JacarandaCluster cx={14} cy={32} radius={9} seed={10} count={18}/>
            <JacarandaCluster cx={86} cy={32} radius={9} seed={11} count={18}/>
            <JacarandaCluster cx={10} cy={18} radius={8} seed={12} count={16}/>
            <JacarandaCluster cx={90} cy={18} radius={8} seed={13} count={16}/>
            <JacarandaCluster cx={50} cy={14} radius={9} seed={14} count={18}/>
            <JacarandaCluster cx={50} cy={28} radius={9} seed={15} count={18}/>
            <JacarandaCluster cx={30} cy={28} radius={8} seed={16} count={16}/>
            <JacarandaCluster cx={70} cy={28} radius={8} seed={17} count={16}/>
            <JacarandaCluster cx={20} cy={50} radius={8} seed={18} count={16}/>
            <JacarandaCluster cx={80} cy={50} radius={8} seed={19} count={16}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="jacarandaAura" color1="#ba68c8" color2="#6a1b9a" />
            <circle cx="50" cy="45" r="48" fill="url(#jacarandaAura)" />
            <JacarandaGround />
            <JacarandaTrunk topY={14}/>
            <JacarandaBranches topY={14}/>

            <JacarandaCluster cx={22} cy={8} radius={10} seed={100} count={20}/>
            <JacarandaCluster cx={78} cy={8} radius={10} seed={101} count={20}/>
            <JacarandaCluster cx={10} cy={22} radius={11} seed={102} count={22}/>
            <JacarandaCluster cx={90} cy={22} radius={11} seed={103} count={22}/>
            <JacarandaCluster cx={6} cy={36} radius={10} seed={104} count={20}/>
            <JacarandaCluster cx={94} cy={36} radius={10} seed={105} count={20}/>
            <JacarandaCluster cx={4} cy={50} radius={9} seed={106} count={18}/>
            <JacarandaCluster cx={96} cy={50} radius={9} seed={107} count={18}/>
            <JacarandaCluster cx={30} cy={-2} radius={10} seed={108} count={20}/>
            <JacarandaCluster cx={70} cy={-2} radius={10} seed={109} count={20}/>
            <JacarandaCluster cx={50} cy={-4} radius={11} seed={110} count={22}/>
            <JacarandaCluster cx={50} cy={10} radius={11} seed={111} count={22}/>
            <JacarandaCluster cx={50} cy={24} radius={11} seed={112} count={22}/>
            <JacarandaCluster cx={30} cy={20} radius={10} seed={113} count={20}/>
            <JacarandaCluster cx={70} cy={20} radius={10} seed={114} count={20}/>
            <JacarandaCluster cx={16} cy={34} radius={10} seed={115} count={20}/>
            <JacarandaCluster cx={84} cy={34} radius={10} seed={116} count={20}/>
            <JacarandaCluster cx={14} cy={58} radius={9} seed={117} count={18}/>
            <JacarandaCluster cx={86} cy={58} radius={9} seed={118} count={18}/>

            <SparkleRing colorScheme="pink" />
        </svg>
    )
}