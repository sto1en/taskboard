import { Aura, SparkleRing, seededRandom } from './common'

// Сердцевидный лист берёзы — компактный, с двумя прожилками.
// Размер r — примерно 2-3 (не 5-8!), чтобы листья были мелкими.
function BirchLeaf({ cx, cy, size = 3, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#a8d97b', vein: '#7ab048', edge: '#6f9e3c' },
        mid:   { fill: '#6fb03d', vein: '#4a8a24', edge: '#3f7a2a' },
        deep:  { fill: '#4e8a3a', vein: '#2f6b22', edge: '#255c1a' },
    }
    const c = palette[tone] || palette.mid
    const s = size
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            {/* сердцевидный лист: основание с выемкой, острый кончик */}
            <path d={`M${cx} ${cy - s * 1.4}
                     C${cx + s * 0.9} ${cy - s * 1} ${cx + s * 1.1} ${cy - s * 0.2} ${cx + s * 0.6} ${cy + s * 0.5}
                     C${cx + s * 0.3} ${cy + s * 1.1} ${cx + s * 0.05} ${cy + s * 1.3} ${cx} ${cy + s * 1.4}
                     C${cx - s * 0.05} ${cy + s * 1.3} ${cx - s * 0.3} ${cy + s * 1.1} ${cx - s * 0.6} ${cy + s * 0.5}
                     C${cx - s * 1.1} ${cy - s * 0.2} ${cx - s * 0.9} ${cy - s * 1} ${cx} ${cy - s * 1.4} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            {/* центральная жилка */}
            <line x1={cx} y1={cy - s * 1.2} x2={cx} y2={cy + s * 1.2}
                  stroke={c.vein} strokeWidth={s * 0.1} opacity="0.7"/>
            {/* одна боковая прожилка в каждую сторону */}
            <line x1={cx} y1={cy - s * 0.2} x2={cx + s * 0.6} y2={cy - s * 0.5}
                  stroke={c.vein} strokeWidth={s * 0.07} opacity="0.55"/>
            <line x1={cx} y1={cy - s * 0.2} x2={cx - s * 0.6} y2={cy - s * 0.5}
                  stroke={c.vein} strokeWidth={s * 0.07} opacity="0.55"/>
        </g>
    )
}

// Кластер из МНОГИХ мелких листьев, хаотично разложенных вокруг точки.
// Размер каждого листа маленький — иначе получится «капуста».
function LeafCluster({ cx, cy, radius = 9, count = 22, seed = 0 }) {
    const leaves = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light', 'deep', 'mid']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        leaves.push(
            <BirchLeaf
                key={i}
                cx={lx}
                cy={ly}
                size={2.1 + seededRandom(seed, i + 200) * 0.9}
                rot={seededRandom(seed, i + 300) * 360}
                tone={tones[i % tones.length]}
            />
        )
    }
    return <g>{leaves}</g>
}

// Чёрный ромбик на стволе
function BarkMark({ cx, cy, w = 1.3, h = 0.55, rot = 0, opacity = 0.9 }) {
    return (
        <ellipse cx={cx} cy={cy} rx={w} ry={h}
                 fill="#1a1a1a" opacity={opacity}
                 transform={rot ? `rotate(${rot} ${cx} ${cy})` : ''}/>
    )
}

function Ground() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="36" ry="4" fill="#8f6f52" opacity="0.7"/>
            <ellipse cx="50" cy="95" rx="26" ry="2.5" fill="#b28c6e" opacity="0.85"/>
            {/* пара травинок */}
            <path d="M30 96 L29 92 M34 96 L35 91 M38 96 L37 92"
                  stroke="#5c8f4a" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
            <path d="M62 96 L63 92 M66 96 L65 91 M70 96 L72 92"
                  stroke="#5c8f4a" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
        </g>
    )
}

// Тонкий прямой ствол с чёрными штрихами.
// startY — от земли, topY — до куда тянется.
function BirchTrunk({ topY = 20 }) {
    const marks = []
    let y = 88
    let i = 0
    while (y > topY + 4) {
        const jitter = (seededRandom(1, i) - 0.5) * 1.5
        const side = i % 2 === 0 ? -0.7 : 0.7
        marks.push(
            <BarkMark
                key={i}
                cx={50 + side + jitter}
                cy={y}
                w={1.2 + seededRandom(2, i) * 0.5}
                h={0.5 + seededRandom(3, i) * 0.15}
                rot={(seededRandom(4, i) - 0.5) * 20}
            />
        )
        y -= 6 + seededRandom(5, i) * 2
        i++
    }
    return (
        <g>
            <path d={`M50 96 L50 ${topY}`}
                  stroke="#f4f1e6" strokeWidth="4.2" strokeLinecap="round" fill="none"/>
            <path d={`M48.5 96 L48.5 ${topY + 2}`}
                  stroke="#d8d0be" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.75"/>
            {/* трещины у земли */}
            <path d="M47 94 C46 90 47 86 48 83" stroke="#4e4238" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M53 94 C54 90 53 86 52 83" stroke="#4e4238" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.75"/>
            {marks}
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            {/* тонкий росток */}
            <path d="M50 94 L50 52" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <BarkMark cx={49} cy={88} w={1} h={0.4} rot={5}/>
            <BarkMark cx={51} cy={76} w={1} h={0.4} rot={-8}/>
            <BarkMark cx={50} cy={64} w={0.9} h={0.35} rot={4}/>
            {/* пара веточек */}
            <path d="M50 76 L42 68" stroke="#f4f1e6" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <path d="M50 70 L58 62" stroke="#f4f1e6" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <LeafCluster cx={42} cy={66} radius={5} count={10} seed={1}/>
            <LeafCluster cx={58} cy={60} radius={5} count={10} seed={2}/>
            <LeafCluster cx={50} cy={52} radius={6} count={14} seed={3}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            <BirchTrunk topY={32} />

            {/* ветки — пары на разной высоте, слегка вверх */}
            <path d="M50 82 L34 72" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M50 82 L66 72" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M50 70 L34 60" stroke="#f4f1e6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M50 70 L66 60" stroke="#f4f1e6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M50 58 L38 48" stroke="#f4f1e6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 58 L62 48" stroke="#f4f1e6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 46 L40 38" stroke="#f4f1e6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 46 L60 38" stroke="#f4f1e6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 36 L44 30" stroke="#f4f1e6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M50 36 L56 30" stroke="#f4f1e6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

            {/* много мелких кластеров по всей кроне */}
            <LeafCluster cx={34} cy={70} radius={9} count={18} seed={10}/>
            <LeafCluster cx={66} cy={70} radius={9} count={18} seed={11}/>
            <LeafCluster cx={34} cy={58} radius={8} count={16} seed={12}/>
            <LeafCluster cx={66} cy={58} radius={8} count={16} seed={13}/>
            <LeafCluster cx={38} cy={46} radius={8} count={16} seed={14}/>
            <LeafCluster cx={62} cy={46} radius={8} count={16} seed={15}/>
            <LeafCluster cx={40} cy={36} radius={7} count={14} seed={16}/>
            <LeafCluster cx={60} cy={36} radius={7} count={14} seed={17}/>
            <LeafCluster cx={44} cy={28} radius={6} count={12} seed={18}/>
            <LeafCluster cx={56} cy={28} radius={6} count={12} seed={19}/>
            {/* центральная верхушка */}
            <LeafCluster cx={50} cy={22} radius={7} count={14} seed={20}/>
            {/* заполняем просветы */}
            <LeafCluster cx={50} cy={62} radius={7} count={14} seed={21}/>
            <LeafCluster cx={50} cy={48} radius={6} count={12} seed={22}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="birchAura" color1="#c4e07a" color2="#7cba3c" />
            <circle cx="50" cy="45" r="46" fill="url(#birchAura)" />
            <Ground />
            <BirchTrunk topY={14} />

            {/* главные ветки — идут вверх под углом, как на референсе */}
            <path d="M50 86 L30 76" stroke="#f4f1e6" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 86 L70 76" stroke="#f4f1e6" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 74 L28 64" stroke="#f4f1e6" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M50 74 L72 64" stroke="#f4f1e6" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M50 62 L30 52" stroke="#f4f1e6" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M50 62 L70 52" stroke="#f4f1e6" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M50 50 L32 42" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M50 50 L68 42" stroke="#f4f1e6" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M50 40 L36 32" stroke="#f4f1e6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 40 L64 32" stroke="#f4f1e6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 30 L40 24" stroke="#f4f1e6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 30 L60 24" stroke="#f4f1e6" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M50 20 L44 16" stroke="#f4f1e6" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M50 20 L56 16" stroke="#f4f1e6" strokeWidth="1.4" strokeLinecap="round" fill="none"/>

            {/* крона из множества мелких кластеров — почти овальная, сужается кверху */}
            <LeafCluster cx={30} cy={74} radius={9} count={20} seed={100}/>
            <LeafCluster cx={70} cy={74} radius={9} count={20} seed={101}/>
            <LeafCluster cx={28} cy={62} radius={9} count={20} seed={102}/>
            <LeafCluster cx={72} cy={62} radius={9} count={20} seed={103}/>
            <LeafCluster cx={30} cy={50} radius={9} count={20} seed={104}/>
            <LeafCluster cx={70} cy={50} radius={9} count={20} seed={105}/>
            <LeafCluster cx={32} cy={40} radius={8} count={18} seed={106}/>
            <LeafCluster cx={68} cy={40} radius={8} count={18} seed={107}/>
            <LeafCluster cx={36} cy={30} radius={8} count={16} seed={108}/>
            <LeafCluster cx={64} cy={30} radius={8} count={16} seed={109}/>
            <LeafCluster cx={40} cy={22} radius={7} count={14} seed={110}/>
            <LeafCluster cx={60} cy={22} radius={7} count={14} seed={111}/>
            <LeafCluster cx={44} cy={14} radius={6} count={12} seed={112}/>
            <LeafCluster cx={56} cy={14} radius={6} count={12} seed={113}/>
            {/* центральные — заполняют промежутки */}
            <LeafCluster cx={50} cy={78} radius={9} count={20} seed={114}/>
            <LeafCluster cx={50} cy={66} radius={9} count={20} seed={115}/>
            <LeafCluster cx={50} cy={52} radius={9} count={20} seed={116}/>
            <LeafCluster cx={50} cy={38} radius={8} count={18} seed={117}/>
            <LeafCluster cx={50} cy={26} radius={8} count={16} seed={118}/>
            <LeafCluster cx={50} cy={16} radius={7} count={14} seed={119}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}