import { Aura, SparkleRing, seededRandom } from './common'

// ============================================================
// КРИСТАЛЛ — ромбовидный, многослойный, с гранями
// ============================================================
function CrystalGem({ cx, cy, size = 6, rot = 0, tone = 'mid', opacity = 1 }) {
    // Палитра: светлые и тёмные грани, прозрачные
    const tones = {
        light: { top: '#e8f8fa', left: '#b8e2e8', right: '#88c8d0', edge: '#5aa8b0', glow: '#b8e2e8' },
        mid:   { top: '#d4f0f4', left: '#a8d8e0', right: '#78b8c8', edge: '#4a98a8', glow: '#a8d8e0' },
        deep:  { top: '#b8e0e8', left: '#88c0cc', right: '#5aa0b0', edge: '#3a8090', glow: '#88c0cc' },
        clear: { top: '#f0fafc', left: '#d0e8ec', right: '#a8d0d8', edge: '#70a8b0', glow: '#d0e8ec' },
    }
    const c = tones[tone] || tones.mid
    const w = size * 0.5
    const h = size

    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={opacity}>
            {/* Мягкое свечение (не неон) */}
            <ellipse cx={cx} cy={cy} rx={w * 1.8} ry={h * 1.6}
                     fill={c.glow} opacity="0.25"/>
            {/* Правая грань (тень) */}
            <polygon
                points={`${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx},${cy - h}`}
                fill={c.right}
                stroke={c.edge}
                strokeWidth="0.2"
            />
            {/* Левая грань (свет) */}
            <polygon
                points={`${cx},${cy - h} ${cx - w},${cy} ${cx},${cy + h} ${cx},${cy - h}`}
                fill={c.left}
                stroke={c.edge}
                strokeWidth="0.2"
            />
            {/* Верхняя светлая грань */}
            <polygon
                points={`${cx},${cy - h} ${cx + w * 0.5},${cy - h * 0.3} ${cx},${cy - h * 0.1} ${cx - w * 0.5},${cy - h * 0.3}`}
                fill={c.top}
                stroke={c.edge}
                strokeWidth="0.15"
            />
            {/* Нижний тёмный кончик */}
            <polygon
                points={`${cx},${cy + h} ${cx + w * 0.35},${cy + h * 0.6} ${cx},${cy + h * 0.5} ${cx - w * 0.35},${cy + h * 0.6}`}
                fill={c.right}
                opacity="0.7"
                stroke={c.edge}
                strokeWidth="0.15"
            />
            {/* Блик */}
            <polygon
                points={`${cx - w * 0.3},${cy - h * 0.5} ${cx - w * 0.1},${cy - h * 0.2} ${cx - w * 0.3},${cy - h * 0.1} ${cx - w * 0.5},${cy - h * 0.3}`}
                fill="#ffffff"
                opacity="0.85"
            />
        </g>
    )
}

// Мелкий кристаллик на ветке
function SmallCrystal({ cx, cy, size = 3, rot = 0 }) {
    return <CrystalGem cx={cx} cy={cy} size={size} rot={rot} tone="mid"/>
}

// ============================================================
// МРАМОРНЫЙ СТВОЛ — белый с бежевыми прожилками
// ============================================================
function MarbleTrunk() {
    return (
        <g>
            {/* Основа ствола — толстый, органично изогнутый */}
            <path d="M50 96
                     C42 88 40 78 44 68
                     C48 58 52 52 50 42
                     C48 34 44 26 46 18
                     L54 18
                     C52 26 56 34 54 42
                     C52 52 48 58 52 68
                     C56 78 58 88 56 96 Z"
                  fill="#f0ece0"
                  stroke="#c8b89a"
                  strokeWidth="0.4"/>

            {/* Тени на стволе (правая сторона) */}
            <path d="M52 96
                     C50 88 50 80 52 72
                     C54 62 54 52 52 42
                     C50 34 50 26 50 18
                     L54 18
                     C52 26 56 34 54 42
                     C52 52 48 58 52 68
                     C56 78 58 88 56 96 Z"
                  fill="#c8b89a"
                  opacity="0.55"/>

            {/* Светлая сторона (левая) */}
            <path d="M46 96
                     C42 86 42 78 46 68
                     C50 58 52 52 50 42
                     C48 34 46 26 47 18
                     L49 18
                     C48 26 50 34 52 42
                     C54 52 52 58 48 68
                     C44 78 46 86 48 96 Z"
                  fill="#faf8f2"
                  opacity="0.7"/>

            {/* Бежево-коричневые прожилки */}
            <path d="M44 88 C42 82 44 76 46 72" stroke="#a88a5a" strokeWidth="0.5" fill="none" opacity="0.7"/>
            <path d="M50 78 C48 72 50 66 52 60" stroke="#a88a5a" strokeWidth="0.5" fill="none" opacity="0.7"/>
            <path d="M46 62 C44 56 46 50 48 46" stroke="#a88a5a" strokeWidth="0.5" fill="none" opacity="0.6"/>
            <path d="M50 48 C48 42 48 36 48 32" stroke="#a88a5a" strokeWidth="0.4" fill="none" opacity="0.6"/>
            <path d="M52 70 C54 64 54 58 52 52" stroke="#a88a5a" strokeWidth="0.4" fill="none" opacity="0.5"/>

            {/* Тёмные точки-поры */}
            <circle cx="46" cy="82" r="0.5" fill="#8a6a3a" opacity="0.6"/>
            <circle cx="52" cy="74" r="0.6" fill="#8a6a3a" opacity="0.6"/>
            <circle cx="47" cy="60" r="0.5" fill="#8a6a3a" opacity="0.6"/>
            <circle cx="50" cy="46" r="0.4" fill="#8a6a3a" opacity="0.5"/>
        </g>
    )
}

// ============================================================
// ВЕТКИ — мраморные, толстые, разветвляются
// ============================================================
function MarbleBranches() {
    return (
        <g>
            {/* Главные ветки — толстые мраморные */}
            <path d="M46 62 C40 56 32 54 24 56"
                  stroke="#f0ece0" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
            <path d="M46 62 C40 56 32 54 24 56"
                  stroke="#c8b89a" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>

            <path d="M54 60 C60 54 68 54 76 58"
                  stroke="#f0ece0" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
            <path d="M54 60 C60 54 68 54 76 58"
                  stroke="#c8b89a" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>

            {/* Второй уровень */}
            <path d="M46 46 C40 42 32 40 24 42"
                  stroke="#f0ece0" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M46 46 C40 42 32 40 24 42"
                  stroke="#c8b89a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>

            <path d="M54 44 C60 40 68 40 76 42"
                  stroke="#f0ece0" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M54 44 C60 40 68 40 76 42"
                  stroke="#c8b89a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>

            {/* Верхний уровень */}
            <path d="M48 32 C44 28 38 26 32 26"
                  stroke="#f0ece0" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M48 32 C44 28 38 26 32 26"
                  stroke="#c8b89a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>

            <path d="M52 30 C56 26 62 24 68 26"
                  stroke="#f0ece0" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M52 30 C56 26 62 24 68 26"
                  stroke="#c8b89a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>

            {/* Верхняя центральная ветка */}
            <path d="M50 22 C50 18 48 14 46 12"
                  stroke="#f0ece0" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M50 22 C50 18 48 14 46 12"
                  stroke="#c8b89a" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.5"/>

            {/* Мелкие веточки — тонкие мраморные */}
            <path d="M24 56 C18 56 14 58 10 60"
                  stroke="#f0ece0" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M24 56 C20 52 16 50 12 48"
                  stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M24 56 C22 60 20 62 18 66"
                  stroke="#f0ece0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

            <path d="M76 58 C82 58 86 60 90 62"
                  stroke="#f0ece0" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M76 58 C80 54 84 52 88 50"
                  stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M76 58 C78 62 80 64 82 68"
                  stroke="#f0ece0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

            <path d="M24 42 C18 40 14 38 10 36"
                  stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M24 42 C22 38 20 36 18 32"
                  stroke="#f0ece0" strokeWidth="1.6" strokeLinecap="round" fill="none"/>

            <path d="M76 42 C82 40 86 38 90 36"
                  stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M76 42 C78 38 80 36 82 32"
                  stroke="#f0ece0" strokeWidth="1.6" strokeLinecap="round" fill="none"/>

            <path d="M32 26 C28 22 24 20 20 18"
                  stroke="#f0ece0" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <path d="M68 26 C72 22 76 20 80 18"
                  stroke="#f0ece0" strokeWidth="1.6" strokeLinecap="round" fill="none"/>

            {/* Корни у основания */}
            <path d="M46 96 C40 97 34 97 28 96"
                  stroke="#f0ece0" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M54 96 C60 97 66 97 72 96"
                  stroke="#f0ece0" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M48 96 C44 98 40 98 36 97"
                  stroke="#c8b89a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M52 96 C56 98 60 98 64 97"
                  stroke="#c8b89a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

// ============================================================
// ЗЕМЛЯ — мраморная плита + кристаллы
// ============================================================
function CrystalGround() {
    return (
        <g>
            {/* Мраморная плита */}
            <ellipse cx="50" cy="96" rx="42" ry="5" fill="#e8e0d0" opacity="0.95"/>
            <ellipse cx="50" cy="95" rx="42" ry="4" fill="#d8c8b0" opacity="0.7"/>
            {/* Прожилки на плите */}
            <path d="M18 96 C24 94 30 95 36 94" stroke="#a88a5a" strokeWidth="0.4" fill="none" opacity="0.5"/>
            <path d="M64 96 C70 94 76 95 82 96" stroke="#a88a5a" strokeWidth="0.4" fill="none" opacity="0.5"/>

            {/* Большие кристаллы у корней */}
            <CrystalGem cx={22} cy={92} size={8} rot={-15} tone="mid"/>
            <CrystalGem cx={30} cy={94} size={5} rot={-5} tone="light"/>
            <CrystalGem cx={70} cy={92} size={9} rot={12} tone="mid"/>
            <CrystalGem cx={78} cy={94} size={6} rot={20} tone="deep"/>
            <CrystalGem cx={36} cy={95} size={4} rot={-20} tone="clear"/>
            <CrystalGem cx={64} cy={95} size={4.5} rot={15} tone="light"/>
        </g>
    )
}

// ============================================================
// SPROUT
// ============================================================
export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CrystalGround />

            {/* Тонкий мраморный росток */}
            <path d="M50 94 C48 86 52 78 50 70 C48 64 50 58 50 54"
                  stroke="#f0ece0" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M49 90 C48 84 51 78 50 72"
                  stroke="#c8b89a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>

            {/* Мелкие веточки */}
            <path d="M50 78 C44 74 40 70 38 64" stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 74 C56 70 60 66 62 60" stroke="#f0ece0" strokeWidth="2" strokeLinecap="round" fill="none"/>

            {/* Кристаллы на концах */}
            <CrystalGem cx={38} cy={62} size={6} rot={-20} tone="mid"/>
            <CrystalGem cx={62} cy={58} size={6} rot={25} tone="light"/>
            <CrystalGem cx={50} cy={50} size={7} rot={0} tone="mid"/>

            {/* Мелкие кристаллики */}
            <SmallCrystal cx={44} cy={70} size={3} rot={-10}/>
            <SmallCrystal cx={56} cy={68} size={3.2} rot={15}/>
        </svg>
    )
}

// ============================================================
// YOUNG
// ============================================================
export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CrystalGround />
            <MarbleTrunk />
            <MarbleBranches />

            {/* Кристаллы на ветках — крупные на концах */}
            <CrystalGem cx={10} cy={58} size={7} rot={-25} tone="mid"/>
            <CrystalGem cx={90} cy={60} size={7} rot={25} tone="light"/>
            <CrystalGem cx={14} cy={46} size={6} rot={-15} tone="deep"/>
            <CrystalGem cx={88} cy={48} size={6} rot={15} tone="mid"/>

            <CrystalGem cx={18} cy={66} size={5.5} rot={-30} tone="light"/>
            <CrystalGem cx={82} cy={66} size={5.5} rot={30} tone="mid"/>

            <CrystalGem cx={10} cy={34} size={6} rot={-20} tone="mid"/>
            <CrystalGem cx={90} cy={34} size={6} rot={20} tone="light"/>
            <CrystalGem cx={18} cy={30} size={5} rot={-15} tone="deep"/>
            <CrystalGem cx={82} cy={30} size={5} rot={15} tone="mid"/>

            <CrystalGem cx={20} cy={16} size={5} rot={-25} tone="light"/>
            <CrystalGem cx={80} cy={16} size={5} rot={25} tone="mid"/>
            <CrystalGem cx={32} cy={24} size={6} rot={-10} tone="mid"/>
            <CrystalGem cx={68} cy={24} size={6} rot={10} tone="light"/>
            <CrystalGem cx={46} cy={10} size={6} rot={0} tone="deep"/>

            {/* Мелкие кристаллики по веткам */}
            <SmallCrystal cx={26} cy={50} size={3} rot={-15}/>
            <SmallCrystal cx={74} cy={50} size={3} rot={15}/>
            <SmallCrystal cx={30} cy={38} size={2.8} rot={-10}/>
            <SmallCrystal cx={70} cy={38} size={2.8} rot={10}/>
            <SmallCrystal cx={40} cy={28} size={3} rot={-5}/>
            <SmallCrystal cx={60} cy={28} size={3} rot={5}/>
            <SmallCrystal cx={44} cy={20} size={2.5} rot={0}/>
        </svg>
    )
}

// ============================================================
// MATURE
// ============================================================
export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="crystalAura" color1="#d4f0f4" color2="#88c8d0" />
            <circle cx="50" cy="45" r="46" fill="url(#crystalAura)" />

            <CrystalGround />
            <MarbleTrunk />
            <MarbleBranches />

            {/* МНОГО кристаллов — крупные на концах, мелкие по веткам */}
            {/* Правый низ */}
            <CrystalGem cx={90} cy={62} size={7} rot={25} tone="mid"/>
            <CrystalGem cx={84} cy={68} size={5} rot={30} tone="light"/>
            <CrystalGem cx={92} cy={50} size={6} rot={20} tone="deep"/>
            <CrystalGem cx={88} cy={48} size={5} rot={15} tone="mid"/>

            {/* Левый низ */}
            <CrystalGem cx={10} cy={60} size={7} rot={-25} tone="mid"/>
            <CrystalGem cx={16} cy={66} size={5} rot={-30} tone="light"/>
            <CrystalGem cx={8}  cy={48} size={6} rot={-20} tone="deep"/>
            <CrystalGem cx={12} cy={46} size={5} rot={-15} tone="mid"/>

            {/* Средний уровень */}
            <CrystalGem cx={24} cy={42} size={6} rot={-15} tone="mid"/>
            <CrystalGem cx={76} cy={42} size={6} rot={15} tone="light"/>
            <CrystalGem cx={16} cy={34} size={5.5} rot={-20} tone="deep"/>
            <CrystalGem cx={84} cy={34} size={5.5} rot={20} tone="mid"/>
            <CrystalGem cx={10} cy={36} size={4.5} rot={-15} tone="light"/>
            <CrystalGem cx={90} cy={36} size={4.5} rot={15} tone="mid"/>

            {/* Верхний уровень */}
            <CrystalGem cx={32} cy={26} size={6} rot={-10} tone="mid"/>
            <CrystalGem cx={68} cy={26} size={6} rot={10} tone="light"/>
            <CrystalGem cx={20} cy={16} size={5} rot={-25} tone="deep"/>
            <CrystalGem cx={80} cy={16} size={5} rot={25} tone="mid"/>
            <CrystalGem cx={28} cy={14} size={4.5} rot={-15} tone="light"/>
            <CrystalGem cx={72} cy={14} size={4.5} rot={15} tone="mid"/>

            {/* Верхушка — большие кристаллы */}
            <CrystalGem cx={46} cy={10} size={7} rot={0} tone="mid"/>
            <CrystalGem cx={54} cy={8}  size={6.5} rot={5} tone="light"/>
            <CrystalGem cx={50} cy={4}  size={6} rot={0} tone="deep"/>
            <CrystalGem cx={40} cy={16} size={5.5} rot={-10} tone="mid"/>
            <CrystalGem cx={60} cy={16} size={5.5} rot={10} tone="light"/>

            {/* Центральные — заполняют */}
            <CrystalGem cx={38} cy={34} size={5} rot={-5} tone="mid"/>
            <CrystalGem cx={62} cy={34} size={5} rot={5} tone="light"/>
            <CrystalGem cx={50} cy={22} size={6} rot={0} tone="mid"/>

            {/* Много мелких кристалликов по веткам */}
            <SmallCrystal cx={22} cy={54} size={3} rot={-15}/>
            <SmallCrystal cx={78} cy={54} size={3} rot={15}/>
            <SmallCrystal cx={28} cy={48} size={2.8} rot={-10}/>
            <SmallCrystal cx={72} cy={48} size={2.8} rot={10}/>
            <SmallCrystal cx={34} cy={32} size={3} rot={-5}/>
            <SmallCrystal cx={66} cy={32} size={3} rot={5}/>
            <SmallCrystal cx={44} cy={16} size={2.8} rot={0}/>
            <SmallCrystal cx={56} cy={18} size={2.8} rot={5}/>
            <SmallCrystal cx={42} cy={28} size={2.5} rot={-8}/>
            <SmallCrystal cx={58} cy={30} size={2.5} rot={8}/>
            <SmallCrystal cx={30} cy={20} size={2.5} rot={-12}/>
            <SmallCrystal cx={70} cy={20} size={2.5} rot={12}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}