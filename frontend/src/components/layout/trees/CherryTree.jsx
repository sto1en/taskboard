import { Aura, SparkleRing, seededRandom } from './common'

const PETAL = {
    light: { petal: '#ffd6e7', edge: '#f8a8c8', core: '#fff5c2' },
    mid:   { petal: '#ffa8c8', edge: '#e86a9a', core: '#ffd97a' },
    deep:  { petal: '#e86a9a', edge: '#b83e6c', core: '#f4b942' },
    blush: { petal: '#ffc0d4', edge: '#e89ab5', core: '#fff0b8' },
}

// Мелкий цветок вишни (одиночный лепесток с точкой)
function CherryBlossom({ cx, cy, r = 2.2, rot = 0, tone = 'mid' }) {
    const p = PETAL[tone] || PETAL.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            {/* 5 мелких лепестков */}
            {[0, 72, 144, 216, 288].map((a, i) => {
                const rad = a * Math.PI / 180
                const px = cx + Math.cos(rad) * r * 0.6
                const py = cy + Math.sin(rad) * r * 0.6
                return (
                    <ellipse key={i} cx={px} cy={py} rx={r * 0.45} ry={r * 0.35}
                             transform={`rotate(${a} ${px} ${py})`}
                             fill={p.petal} stroke={p.edge} strokeWidth={r * 0.08}/>
                )
            })}
            <circle cx={cx} cy={cy} r={r * 0.22} fill={p.core}/>
        </g>
    )
}

// Тёмная вишенка (ягода) с бликом
function CherryBerry({ cx, cy, r = 2.4 }) {
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="#8b0a2a"/>
            <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.4} fill="#c9305a" opacity="0.8"/>
            <circle cx={cx - r * 0.4} cy={cy - r * 0.4} r={r * 0.15} fill="#fff" opacity="0.9"/>
        </g>
    )
}

// Гроздь — 3-5 цветков плотно + редкая ягода
function BlossomCluster({ cx, cy, radius = 5, seed = 0, withBerry = true }) {
    const flowers = []
    const tones = ['light', 'mid', 'deep', 'blush']
    const count = 4 + Math.floor(seededRandom(seed, 0) * 3)

    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i + 1) * Math.PI * 2
        const d = radius * (0.1 + seededRandom(seed, i + 10) * 0.9)
        const px = cx + Math.cos(a) * d
        const py = cy + Math.sin(a) * d * 0.7
        flowers.push(
            <CherryBlossom key={i} cx={px} cy={py}
                           r={radius * 0.4 + seededRandom(seed, i + 20) * radius * 0.15}
                           rot={seededRandom(seed, i + 30) * 360}
                           tone={tones[i % tones.length]}/>
        )
    }
    if (withBerry && seededRandom(seed, 100) > 0.55) {
        flowers.push(
            <CherryBerry key="b" cx={cx - radius * 0.3} cy={cy + radius * 0.4}
                         r={radius * 0.45}/>
        )
    }
    return <g>{flowers}</g>
}

// Каскад — серия гроздьев вдоль ветки
function BlossomCascade({ x1, y1, x2, y2, seed = 0, count = 4 }) {
    const items = []
    for (let i = 0; i < count; i++) {
        const t = (i + 1) / (count + 1)
        const cx = x1 + (x2 - x1) * t
        const cy = y1 + (y2 - y1) * t
        items.push(
            <BlossomCluster key={i} cx={cx} cy={cy}
                            radius={3.5 + seededRandom(seed, i) * 2}
                            seed={seed + i * 100}
                            withBerry={i % 2 === 0}/>
        )
    }
    return <g>{items}</g>
}

// Прямой ствол с небольшим наклоном вправо
function CherryTrunk({ topY = 18 }) {
    return (
        <g>
            {/* Основной ствол — прямо, слегка наклонён */}
            <path d={`M50 96 C50.5 84 51.5 72 52 60 C52.5 48 53 36 52 ${topY}`}
                  stroke="#4a2418" strokeWidth="6" strokeLinecap="round" fill="none"/>
            {/* Блик */}
            <path d={`M47.5 90 C48 78 49 66 49.5 54 C50 42 50.5 30 50 ${topY + 2}`}
                  stroke="#7a4230" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* Полоски коры */}
            {[88, 78, 68, 58, 48, 38, 28].filter(y => y > topY).map((y, i) => (
                <line key={i}
                      x1={48 + (i % 2) * 0.5} y1={y}
                      x2={50 + (i % 2) * 0.5} y2={y + 2}
                      stroke="#2a1410" strokeWidth="0.5" strokeLinecap="round"/>
            ))}
        </g>
    )
}

// Свисающие ветки-каскады
function CherryBranches({ topY = 18 }) {
    // Каждая ветка — длинная, свисает вниз
    return (
        <g stroke="#4a2418" strokeLinecap="round" fill="none">
            {/* Верхние ветки — веером вверх */}
            <path d={`M52 ${topY + 6} C48 ${topY} 42 ${topY - 2} 36 ${topY + 2}`} strokeWidth="2.4"/>
            <path d={`M52 ${topY + 6} C56 ${topY} 62 ${topY - 2} 68 ${topY + 2}`} strokeWidth="2.4"/>

            {/* Средние ветки — раскидистые, дугой */}
            <path d={`M52 ${topY + 18} C44 ${topY + 14} 34 ${topY + 14} 26 ${topY + 22}`} strokeWidth="2.2"/>
            <path d={`M52 ${topY + 18} C60 ${topY + 14} 70 ${topY + 14} 78 ${topY + 22}`} strokeWidth="2.2"/>

            {/* Нижние ветки — каскадом вниз */}
            <path d={`M52 ${topY + 30} C44 ${topY + 26} 32 ${topY + 30} 22 ${topY + 40}`} strokeWidth="2"/>
            <path d={`M52 ${topY + 30} C60 ${topY + 26} 72 ${topY + 30} 82 ${topY + 40}`} strokeWidth="2"/>

            {/* Мелкие веточки-«косички», свисают длинными линиями */}
            <path d={`M36 ${topY + 2} C32 ${topY + 6} 28 ${topY + 12} 24 ${topY + 20}`} strokeWidth="1.2"/>
            <path d={`M68 ${topY + 2} C72 ${topY + 6} 76 ${topY + 12} 80 ${topY + 20}`} strokeWidth="1.2"/>

            <path d={`M26 ${topY + 22} C22 ${topY + 26} 16 ${topY + 32} 12 ${topY + 42}`} strokeWidth="1"/>
            <path d={`M78 ${topY + 22} C82 ${topY + 26} 88 ${topY + 32} 92 ${topY + 42}`} strokeWidth="1"/>

            <path d={`M22 ${topY + 40} C18 ${topY + 46} 14 ${topY + 52} 12 ${topY + 62}`} strokeWidth="0.9"/>
            <path d={`M82 ${topY + 40} C86 ${topY + 46} 90 ${topY + 52} 92 ${topY + 62}`} strokeWidth="0.9"/>
        </g>
    )
}

function CherryGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="38" ry="4" fill="#6b4a3a" opacity="0.7"/>
            <ellipse cx="50" cy="95" rx="28" ry="2.6" fill="#8a6553" opacity="0.85"/>
            <path d="M20 96 L18 92 M24 96 L25 91 M28 96 L27 92"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M72 96 L73 91 M76 96 L78 92 M80 96 L79 91"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            {/* Опавшие цветы и вишенки */}
            <ellipse cx="30" cy="94" rx="1.2" ry="0.7" fill="#ffa8c8" opacity="0.85"/>
            <ellipse cx="48" cy="95" rx="1.3" ry="0.8" fill="#ffd6e7" opacity="0.8"/>
            <ellipse cx="66" cy="94" rx="1.1" ry="0.7" fill="#ffa8c8" opacity="0.85"/>
            <circle cx="40" cy="96" r="0.9" fill="#8b0a2a" opacity="0.9"/>
            <circle cx="58" cy="96" r="0.8" fill="#8b0a2a" opacity="0.9"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CherryGround />
            {/* Тонкий росток с двумя каскадными веточками */}
            <path d="M50 94 C50 84 51 74 51 62" stroke="#4a2418" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M51 78 C46 74 42 70 40 64" stroke="#4a2418" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <path d="M51 74 C56 70 60 66 62 60" stroke="#4a2418" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <BlossomCascade x1={40} y1={66} x2={36} y2={58} seed={1} count={3}/>
            <BlossomCascade x1={62} y1={62} x2={66} y2={54} seed={2} count={3}/>
            <BlossomCluster cx={51} cy={56} radius={5} seed={3}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CherryGround />
            <CherryTrunk topY={28}/>
            <CherryBranches topY={28}/>

            {/* Каскадные гроздья вдоль веток */}
            <BlossomCascade x1={36} y1={30} x2={24} y2={20} seed={10} count={3}/>
            <BlossomCascade x1={68} y1={30} x2={80} y2={20} seed={11} count={3}/>

            <BlossomCascade x1={26} y1={46} x2={12} y2={42} seed={12} count={4}/>
            <BlossomCascade x1={78} y1={46} x2={92} y2={42} seed={13} count={4}/>

            <BlossomCascade x1={22} y1={68} x2={12} y2={82} seed={14} count={4}/>
            <BlossomCascade x1={82} y1={68} x2={92} y2={82} seed={15} count={4}/>

            <BlossomCascade x1={24} y1={48} x2={16} y2={62} seed={16} count={3}/>
            <BlossomCascade x1={80} y1={48} x2={88} y2={62} seed={17} count={3}/>

            <BlossomCluster cx={52} cy={26} radius={6} seed={20}/>
            <BlossomCluster cx={48} cy={40} radius={5} seed={21}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="cherryAura" color1="#ffc0d4" color2="#e86a9a" />
            <circle cx="50" cy="45" r="46" fill="url(#cherryAura)" />
            <CherryGround />
            <CherryTrunk topY={12}/>
            <CherryBranches topY={12}/>

            {/* Очень много гроздьев — каскады по всем веткам */}
            <BlossomCascade x1={36} y1={18} x2={22} y2={10} seed={100} count={4}/>
            <BlossomCascade x1={68} y1={18} x2={82} y2={10} seed={101} count={4}/>

            <BlossomCascade x1={26} y1={34} x2={8} y2={30} seed={102} count={5}/>
            <BlossomCascade x1={78} y1={34} x2={96} y2={30} seed={103} count={5}/>

            <BlossomCascade x1={22} y1={52} x2={6} y2={56} seed={104} count={5}/>
            <BlossomCascade x1={82} y1={52} x2={98} y2={56} seed={105} count={5}/>

            <BlossomCascade x1={22} y1={72} x2={10} y2={86} seed={106} count={5}/>
            <BlossomCascade x1={82} y1={72} x2={94} y2={86} seed={107} count={5}/>

            <BlossomCascade x1={12} y1={42} x2={8} y2={62} seed={108} count={4}/>
            <BlossomCascade x1={92} y1={42} x2={96} y2={62} seed={109} count={4}/>

            {/* Кульминация — много гроздьев в центре */}
            <BlossomCluster cx={52} cy={14} radius={7} seed={110}/>
            <BlossomCluster cx={48} cy={24} radius={6} seed={111}/>
            <BlossomCluster cx={52} cy={36} radius={6} seed={112}/>
            <BlossomCluster cx={48} cy={48} radius={6} seed={113}/>

            {/* Одиночные вишенки между цветами */}
            <CherryBerry cx={16} cy={24} r={2}/>
            <CherryBerry cx={84} cy={22} r={2}/>
            <CherryBerry cx={10} cy={50} r={2.2}/>
            <CherryBerry cx={90} cy={52} r={2.2}/>
            <CherryBerry cx={14} cy={80} r={2}/>
            <CherryBerry cx={88} cy={78} r={2}/>
            <CherryBerry cx={30} cy={12} r={1.8}/>
            <CherryBerry cx={70} cy={10} r={1.8}/>

            <SparkleRing colorScheme="pink" />
        </svg>
    )
}