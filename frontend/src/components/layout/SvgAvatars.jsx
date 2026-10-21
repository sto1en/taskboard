// SVG-аватарки в стиле «милые чиби-персонажи в круге».
// code совпадает с кодом аватарки в БД (a-wizard, a-zombie, ...).
//
// Общий стиль: пастельный фон, крупные глаза с бликами, мягкие румяна,
// округлые формы и тёплые цвета. Даже «страшные» персонажи (скелет, жнец,
// зомби, гаргулья) нарисованы дружелюбно и без пугающих деталей.

const INK = '#3b2b3a'

const BG = {
    lavender: '#d9ccff',
    peach:    '#ffd6bf',
    aqua:     '#bfeef0',
    rose:     '#ffd0e4',
    lemon:    '#ffe9a8',
    mint:     '#c9ecc0',
    navy:     '#9aa8e8',
    lilac:    '#e2d9f7',
    indigo:   '#b9c2ef',
    slate:    '#d5d2ef',
    sky:      '#c9e6ff',
    sand:     '#f5e3c6',
    honey:    '#ffdf9e',
    ice:      '#d9efff',
}

function Base({ bg = BG.sky, children }) {
    return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill={bg} />
            <ellipse cx="23" cy="13" rx="25" ry="16" fill="#ffffff" opacity="0.22" />
            <ellipse cx="34" cy="60" rx="24" ry="10" fill="#000000" opacity="0.07" />
            <circle cx="32" cy="32" r="31" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.3" />
            <circle cx="51" cy="11" r="1.6" fill="#ffffff" opacity="0.8" />
            <circle cx="56" cy="16" r="1" fill="#ffffff" opacity="0.6" />
            {children}
        </svg>
    )
}

function Eyes({ cx = 32, y = 36, gap = 5.4, size = 3.5, color = INK }) {
    return (
        <g>
            <ellipse cx={cx - gap} cy={y} rx={size} ry={size * 1.18} fill={color} />
            <ellipse cx={cx + gap} cy={y} rx={size} ry={size * 1.18} fill={color} />
            <circle cx={cx - gap - size * 0.3} cy={y - size * 0.42} r={size * 0.4} fill="#ffffff" />
            <circle cx={cx + gap - size * 0.3} cy={y - size * 0.42} r={size * 0.4} fill="#ffffff" />
            <circle cx={cx - gap + size * 0.34} cy={y + size * 0.4} r={size * 0.18} fill="#ffffff" opacity="0.9" />
            <circle cx={cx + gap + size * 0.34} cy={y + size * 0.4} r={size * 0.18} fill="#ffffff" opacity="0.9" />
        </g>
    )
}

function Cheeks({ cx = 32, y = 42, gap = 10, color = '#ff7fa8', opacity = 0.35 }) {
    return (
        <g fill={color} opacity={opacity}>
            <ellipse cx={cx - gap} cy={y} rx="4" ry="2.4" />
            <ellipse cx={cx + gap} cy={y} rx="4" ry="2.4" />
        </g>
    )
}

function Smile({ cx = 32, y = 43, w = 3, color = '#6b4351', open = false }) {
    if (open) {
        return (
            <g>
                <path d={`M${cx - w} ${y} Q${cx} ${y + 4} ${cx + w} ${y} Z`} fill="#7c3d4b" />
                <path d={`M${cx - 1.8} ${y + 2.2} Q${cx} ${y + 4.2} ${cx + 1.8} ${y + 2.2} Z`} fill="#ff9eb5" />
            </g>
        )
    }
    return (
        <path
            d={`M${cx - w} ${y} Q${cx} ${y + 2.8} ${cx + w} ${y}`}
            stroke={color}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
        />
    )
}

function Star({ cx, cy, r = 3, fill = '#ffffff', opacity = 0.8 }) {
    return (
        <path
            d={`M${cx} ${cy - r} L${cx + r * 0.32} ${cy - r * 0.32} L${cx + r} ${cy} L${cx + r * 0.32} ${cy + r * 0.32} L${cx} ${cy + r} L${cx - r * 0.32} ${cy + r * 0.32} L${cx - r} ${cy} L${cx - r * 0.32} ${cy - r * 0.32} Z`}
            fill={fill}
            opacity={opacity}
        />
    )
}

export function SvgAvatar({ code }) {
    switch (code) {
        case 'a-wizard':
            return (
                <Base bg={BG.lavender}>
                    <Star cx={50} cy={12} r={3} fill="#ffffff" opacity={0.75} />
                    <Star cx={12} cy={22} r={2} fill="#ffd45c" opacity={0.8} />
                    <path d="M17 36 Q14 29 19 27 L45 27 Q50 29 47 36 L45 43 Q40 36 32 37 Q24 36 19 43 Z"
                          fill="#6b4a3a" />
                    <ellipse cx="32" cy="39" rx="14" ry="13" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M18 33 Q18 28 24 28 Q22 31 22 34 Z" fill="#6b4a3a" />
                    <path d="M46 33 Q46 28 40 28 Q42 31 42 34 Z" fill="#6b4a3a" />
                    <path d="M18 28 Q22 8 32 6 Q42 8 46 28 Z" fill="#7c5cff" stroke="#4a2f9e" strokeWidth="1.4" />
                    <path d="M16 27 Q32 21 48 27 Q48 31 32 32 Q16 31 16 27 Z"
                          fill="#6a46ec" stroke="#4a2f9e" strokeWidth="1.2" />
                    <path d="M18 25.5 Q32 20 46 25.5" stroke="#ffd45c" strokeWidth="3" fill="none" />
                    <Star cx={32} cy={17} r={3.2} fill="#ffd45c" opacity={1} />
                    <Eyes y={39} gap={5.2} size={3.3} />
                    <Cheeks y={44} gap={9.5} />
                    <Smile y={45} w={3} />
                </Base>
            )

        case 'a-devil':
            return (
                <Base bg={BG.peach}>
                    <path d="M20 25 Q16 15 22 16 Q27 18 26 26 Z" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1.2" />
                    <path d="M44 25 Q48 15 42 16 Q37 18 38 26 Z" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="16" ry="15" fill="#ff9a8f" stroke="#d96a6a" strokeWidth="1.3" />
                    <path d="M18 32 Q16 25 23 26 Q27 29 26 35 Z" fill="#7a3b4a" />
                    <path d="M46 32 Q48 25 41 26 Q37 29 38 35 Z" fill="#7a3b4a" />
                    <Eyes y={37} gap={5.6} size={3.4} />
                    <Cheeks y={43} gap={10} color="#ff5f6b" opacity={0.3} />
                    <Smile y={44} w={3.2} open />
                    <path d="M29 44 L29.8 46.7 L30.6 44 Z" fill="#ffffff" />
                    <path d="M33.4 44 L34.2 46.7 L35 44 Z" fill="#ffffff" />
                </Base>
            )

        case 'a-viking':
            return (
                <Base bg={BG.aqua}>
                    <path d="M18 25 Q10 20 12 12 Q18 14 21 22 Z" fill="#f6e7c8" stroke="#c9b48a" strokeWidth="1.2" />
                    <path d="M46 25 Q54 20 52 12 Q46 14 43 22 Z" fill="#f6e7c8" stroke="#c9b48a" strokeWidth="1.2" />
                    <path d="M16 34 Q14 24 22 23 L42 23 Q50 24 48 34 L46 44 Q42 40 38 42 L26 42 Q22 40 18 44 Z"
                          fill="#f2c76e" stroke="#c99b45" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="14" ry="13" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M16 28 Q32 10 48 28 Z" fill="#d9e2ef" stroke="#7f8ea3" strokeWidth="1.4" />
                    <rect x="14" y="25.5" width="36" height="4" rx="2" fill="#b8c2d8" stroke="#7f8ea3" strokeWidth="1.2" />
                    <circle cx="32" cy="20" r="2" fill="#8fb8e0" />
                    <path d="M20 40 Q22 52 32 54 Q42 52 44 40 Q38 44 32 44 Q26 44 20 40 Z"
                          fill="#f2c76e" stroke="#c99b45" strokeWidth="1.2" />
                    <Eyes y={37} gap={5.2} size={3.2} />
                    <Cheeks y={41} gap={10} />
                    <Smile y={46} w={2.4} />
                </Base>
            )

        case 'a-unicorn':
            return (
                <Base bg={BG.rose}>
                    <path d="M14 32 Q9 22 17 17 Q19 25 25 23 Q23 15 32 13 Q35 21 40 19 Q42 12 48 16 Q51 23 46 30"
                          fill="none" stroke="#b79cff" strokeWidth="4.6" strokeLinecap="round" />
                    <path d="M16 30 Q12 22 18 19" fill="none" stroke="#8fd3ff" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M46 30 Q50 22 44 19" fill="none" stroke="#ff9ecb" strokeWidth="2.4" strokeLinecap="round" />
                    <ellipse cx="32" cy="38" rx="16" ry="14" fill="#fff7fb" stroke="#d9b8cf" strokeWidth="1.3" />
                    <path d="M19 28 L16 18 L26 23 Z" fill="#fff7fb" stroke="#d9b8cf" strokeWidth="1.2" />
                    <path d="M45 28 L48 18 L38 23 Z" fill="#fff7fb" stroke="#d9b8cf" strokeWidth="1.2" />
                    <path d="M32 22 L36 10 L38 22 Z" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1.2" />
                    <path d="M33.5 18.5 L36.5 15.5" stroke="#d99a2b" strokeWidth="1" />
                    <path d="M25 25 Q29 20 32 25 Q35 20 39 25 Q36 28 32 27 Q28 28 25 25 Z" fill="#b79cff" />
                    <ellipse cx="32" cy="45" rx="9" ry="6" fill="#ffe9f3" />
                    <Eyes y={36} gap={5.6} size={3.2} />
                    <Cheeks y={42} gap={10} />
                    <ellipse cx="29.5" cy="45" rx="1.1" ry="0.7" fill="#c98fb0" />
                    <ellipse cx="34.5" cy="45" rx="1.1" ry="0.7" fill="#c98fb0" />
                    <Smile y={47.5} w={2} />
                </Base>
            )

        case 'a-pizza':
            return (
                <Base bg={BG.lemon}>
                    <path d="M12 20 L52 20 L32 57 Z" fill="#ffd166" stroke="#d99a2b"
                          strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M12 20 Q32 10 52 20 Q32 16 12 20 Z" fill="#e9a94c" stroke="#c9852e" strokeWidth="1.2" />
                    <ellipse cx="22" cy="27" rx="3" ry="2" fill="#ff7b7b" stroke="#d95f5f" />
                    <ellipse cx="42" cy="29" rx="3" ry="2" fill="#ff7b7b" stroke="#d95f5f" />
                    <ellipse cx="25" cy="42" rx="3" ry="2" fill="#ff7b7b" stroke="#d95f5f" />
                    <ellipse cx="39" cy="44" rx="3" ry="2" fill="#ff7b7b" stroke="#d95f5f" />
                    <ellipse cx="32" cy="25" rx="2.2" ry="3.2" fill="#7ec86a" transform="rotate(20 32 25)" />
                    <Eyes y={36} gap={5} size={3.1} />
                    <Cheeks y={41} gap={9} />
                    <Smile y={44} w={3} />
                </Base>
            )

        case 'a-bear':
            return (
                <Base bg={BG.peach}>
                    <circle cx="19" cy="23" r="7.5" fill="#c98b5e" stroke="#8a5836" strokeWidth="1.2" />
                    <circle cx="45" cy="23" r="7.5" fill="#c98b5e" stroke="#8a5836" strokeWidth="1.2" />
                    <circle cx="19" cy="23" r="3.8" fill="#e8b98f" />
                    <circle cx="45" cy="23" r="3.8" fill="#e8b98f" />
                    <ellipse cx="32" cy="38" rx="16" ry="15" fill="#c98b5e" stroke="#8a5836" strokeWidth="1.3" />
                    <ellipse cx="32" cy="44" rx="9" ry="6.5" fill="#f6dcc0" />
                    <Eyes y={35} gap={6} size={3.2} />
                    <Cheeks y={41} gap={10.5} />
                    <ellipse cx="32" cy="40" rx="2.4" ry="1.8" fill="#5b3a2a" />
                    <path d="M32 42 L32 44 M28.5 45 Q32 48 35.5 45" stroke="#5b3a2a"
                          strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </Base>
            )

        case 'a-lightning':
            return (
                <Base bg={BG.navy}>
                    <Star cx={12} cy={16} r={2.2} fill="#ffffff" opacity={0.7} />
                    <Star cx={54} cy={22} r={1.7} fill="#ffffff" opacity={0.6} />
                    <g stroke="#9aa6c4" strokeWidth="1.4">
                        <circle cx="20" cy="24" r="8" fill="#eef2fb" />
                        <circle cx="32" cy="20" r="11" fill="#eef2fb" />
                        <circle cx="44" cy="25" r="8" fill="#eef2fb" />
                        <rect x="14" y="24" width="36" height="13" rx="6.5" fill="#eef2fb" />
                    </g>
                    <Eyes y={30} gap={5.2} size={3.1} />
                    <Cheeks y={35} gap={9} />
                    <Smile y={37} w={2.8} color="#5a6a9e" />
                    <path d="M36 38 L28 52 Q27 55 30 54 L34 53 L31 61 Q30 63 32 61 L41 47 Q42 45 39 45 L35 45 L38 39 Q39 37 36 38 Z"
                          fill="#ffe066" stroke="#e0a800" strokeWidth="1.2" strokeLinejoin="round" />
                </Base>
            )

        case 'a-sunflower':
            return (
                <Base bg={BG.mint}>
                    {Array.from({ length: 10 }).map((_, i) => {
                        const a = (i * 36) * Math.PI / 180
                        const cx = 32 + Math.cos(a) * 16
                        const cy = 35 + Math.sin(a) * 16
                        return (
                            <ellipse key={i} cx={cx} cy={cy} rx="5.2" ry="8.4"
                                     transform={`rotate(${i * 36} ${cx} ${cy})`}
                                     fill="#ffd45c" stroke="#e8a93a" strokeWidth="1.1" />
                        )
                    })}
                    <circle cx="32" cy="35" r="12" fill="#b07a45" stroke="#8a5a30" strokeWidth="1.3" />
                    <circle cx="32" cy="35" r="13.2" fill="none" stroke="#ffd45c" strokeWidth="1.2" opacity="0.45" />
                    <Eyes y={34} gap={4.4} size={2.8} color="#4a2f18" />
                    <Cheeks y={39} gap={8} color="#ff9ecb" opacity={0.5} />
                    <Smile y={41} w={2.6} color="#ffe9c9" />
                    <path d="M32 47 L32 58" stroke="#5fa348" strokeWidth="3" strokeLinecap="round" />
                    <path d="M32 52 Q24 50 22 56 Q28 58 32 54 Z" fill="#7ec86a" stroke="#5fa348" strokeWidth="0.8" />
                </Base>
            )

        case 'a-rocket':
            return (
                <Base bg={BG.navy}>
                    <Star cx={11} cy={18} r={2} fill="#ffffff" opacity={0.75} />
                    <Star cx={51} cy={13} r={2.6} fill="#ffd45c" opacity={0.8} />
                    <Star cx={56} cy={33} r={1.6} fill="#ffffff" opacity={0.6} />
                    <path d="M22 40 L13 51 L23 47 Z" fill="#ff8f8f" stroke="#d96a6a" strokeWidth="1.1" />
                    <path d="M42 40 L51 51 L41 47 Z" fill="#ff8f8f" stroke="#d96a6a" strokeWidth="1.1" />
                    <path d="M32 7 C41 15 44 28 42 45 L22 45 C20 28 23 15 32 7 Z"
                          fill="#f6f8ff" stroke="#9aa6c4" strokeWidth="1.4" />
                    <path d="M32 7 C36 11 38 16 39 21 L25 21 C26 16 28 11 32 7 Z" fill="#ff8f8f" />
                    <circle cx="32" cy="27" r="9" fill="none" stroke="#c7d2e0" strokeWidth="1.6" />
                    <circle cx="32" cy="27" r="7" fill="#7fd9d1" stroke="#4a9aa0" strokeWidth="1.4" />
                    <Eyes y={26} gap={3} size={1.7} />
                    <Smile y={30} w={1.8} color="#2f6f74" />
                    <path d="M26 45 Q32 58 38 45 Q32 49 26 45 Z" fill="#ffb46b" />
                    <path d="M29 45 Q32 52 35 45 Q32 48 29 45 Z" fill="#ffe066" />
                </Base>
            )

        case 'a-soccer':
            return (
                <Base bg={BG.mint}>
                    <ellipse cx="32" cy="55" rx="18" ry="4" fill="#8fbf6a" opacity="0.55" />
                    <path d="M14 54 Q16 49 19 54 M45 54 Q48 49 51 54" stroke="#7ec86a"
                          strokeWidth="2" fill="none" strokeLinecap="round" />
                    <circle cx="32" cy="32" r="19" fill="#ffffff" stroke="#b8c2d8" strokeWidth="1.4" />
                    <path d="M32 15 L37 19 L35 25 L29 25 L27 19 Z" fill={INK} opacity="0.85" />
                    <path d="M14 29 L19 32 L17 38 L12 36 Z" fill={INK} opacity="0.8" />
                    <path d="M50 29 L45 32 L47 38 L52 36 Z" fill={INK} opacity="0.8" />
                    <path d="M25 47 L32 43 L39 47 L36 52 L28 52 Z" fill={INK} opacity="0.75" />
                    <Eyes y={34} gap={5.2} size={3.2} />
                    <Cheeks y={40} gap={9.5} />
                    <Smile y={42} w={2.8} />
                </Base>
            )

        case 'a-ninja':
            return (
                <Base bg={BG.indigo}>
                    <ellipse cx="32" cy="37" rx="17" ry="16" fill="#3f4a6b" stroke="#2a3148" strokeWidth="1.3" />
                    <path d="M15 30 Q32 25 49 30 L49 34 Q32 29 15 34 Z" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="1" />
                    <path d="M47 31 L56 27 L54 33 L57 37 L48 36 Z" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="1" />
                    <path d="M18 34 Q32 28 46 34 L46 40 Q32 44 18 40 Z" fill="#ffe0c2" />
                    <Eyes y={36.5} gap={5.2} size={3.2} />
                    <Cheeks y={39.8} gap={9.5} color="#ff8f8f" opacity={0.35} />
                    <path d="M18 40 Q32 45 46 40 L45 46 Q32 50 19 46 Z" fill="#3f4a6b" stroke="#2a3148" strokeWidth="1" />
                </Base>
            )

        case 'a-skull':
            return (
                <Base bg={BG.lilac}>
                    <path d="M18 30 Q18 14 32 14 Q46 14 46 30 L46 40 Q46 45 41 46 L40 52 L24 52 L23 46 Q18 45 18 40 Z"
                          fill="#fffaf5" stroke="#cfc4dd" strokeWidth="1.4" />
                    <ellipse cx="26" cy="32" rx="4.2" ry="4.8" fill="#4a3b55" />
                    <ellipse cx="38" cy="32" rx="4.2" ry="4.8" fill="#4a3b55" />
                    <circle cx="24.8" cy="30" r="1.4" fill="#ffffff" />
                    <circle cx="36.8" cy="30" r="1.4" fill="#ffffff" />
                    <circle cx="27.2" cy="33.6" r="0.7" fill="#ffffff" opacity="0.8" />
                    <circle cx="39.2" cy="33.6" r="0.7" fill="#ffffff" opacity="0.8" />
                    <Cheeks y={40} gap={10} color="#ff9ecb" opacity={0.45} />
                    <path d="M30 39 L32 41 L34 39" stroke="#cfc4dd" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M28 46 Q32 49 36 46" stroke="#b8aac9" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                    <path d="M30 46 L30 49 M34 46 L34 49" stroke="#cfc4dd" strokeWidth="1" />
                    <circle cx="44" cy="17" r="2.4" fill="#ff9ecb" />
                    <circle cx="48" cy="20" r="2.2" fill="#ffd45c" />
                    <circle cx="41" cy="21" r="2.2" fill="#b79cff" />
                </Base>
            )

        case 'a-shark':
            return (
                <Base bg={BG.aqua}>
                    <path d="M32 17 L24 7 L38 14 Z" fill="#5fb6d9" stroke="#3f8fae" strokeWidth="1.2" />
                    <path d="M13 39 Q6 44 12 49 Q15 45 18 45 Z" fill="#5fb6d9" stroke="#3f8fae" strokeWidth="1.1" />
                    <ellipse cx="32" cy="38" rx="19" ry="15" fill="#7fc7e8" stroke="#3f8fae" strokeWidth="1.3" />
                    <ellipse cx="32" cy="45" rx="14" ry="7" fill="#eaf8ff" />
                    <Eyes y={35} gap={6.5} size={3.3} />
                    <Cheeks y={41} gap={11} color="#ff8fb1" opacity={0.3} />
                    <path d="M24 44 Q32 49 40 44" stroke="#3f8fae" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M27 44.5 L28.5 47 L30 44.5 Z" fill="#ffffff" />
                    <path d="M34 44.5 L35.5 47 L37 44.5 Z" fill="#ffffff" />
                </Base>
            )

        case 'a-leprechaun':
            return (
                <Base bg={BG.mint}>
                    <path d="M19 36 Q14 26 20 22 L44 22 Q50 26 45 36 L45 44 Q40 48 32 48 Q24 48 19 44 Z"
                          fill="#f0a24a" stroke="#c97e2e" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="13" ry="12" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M16 27 Q16 10 32 9 Q48 10 48 27 Z" fill="#4a9e5c" stroke="#2e6e3a" strokeWidth="1.3" />
                    <rect x="13" y="25" width="38" height="5" rx="2.5" fill="#3f8a4f" stroke="#2e6e3a" strokeWidth="1" />
                    <rect x="27" y="23.5" width="10" height="7" rx="2" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1" />
                    <rect x="30" y="25.5" width="4" height="3" rx="1" fill="#3f8a4f" />
                    <g fill="#7ec86a" stroke="#5fa348" strokeWidth="0.7">
                        <circle cx="44" cy="15" r="2.4" />
                        <circle cx="48" cy="18" r="2.4" />
                        <circle cx="44" cy="21" r="2.4" />
                        <circle cx="40" cy="18" r="2.4" />
                    </g>
                    <Eyes y={38} gap={5} size={3.1} />
                    <Cheeks y={42} gap={9.5} />
                    <Smile y={44} w={2.6} />
                    <path d="M22 46 Q24 54 32 56 Q40 54 42 46 Q36 50 32 49 Q28 50 22 46 Z"
                          fill="#f0a24a" stroke="#c97e2e" strokeWidth="1.2" />
                </Base>
            )

        case 'a-queen':
            return (
                <Base bg={BG.rose}>
                    <path d="M16 36 Q13 22 22 20 L42 20 Q51 22 48 36 L46 46 Q40 42 32 43 Q24 42 18 46 Z"
                          fill="#8a5b3a" stroke="#5b3a24" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="13" ry="12.5" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M17 24 L20 10 L26 18 L32 8 L38 18 L44 10 L47 24 Z"
                          fill="#ffd45c" stroke="#d99a2b" strokeWidth="1.3" strokeLinejoin="round" />
                    <rect x="17" y="22.5" width="30" height="4.5" rx="2.2" fill="#f0b93c" stroke="#d99a2b" strokeWidth="1" />
                    <circle cx="20" cy="12" r="1.8" fill="#ff8f8f" />
                    <circle cx="32" cy="10" r="1.8" fill="#7fd9d1" />
                    <circle cx="44" cy="12" r="1.8" fill="#b79cff" />
                    <Eyes y={38} gap={5.2} size={3.2} />
                    <Cheeks y={43} gap={9.5} />
                    <Smile y={45} w={2.6} />
                    <circle cx="17" cy="37" r="1.5" fill="#ffd45c" />
                    <circle cx="47" cy="37" r="1.5" fill="#ffd45c" />
                </Base>
            )

        case 'a-potion':
            return (
                <Base bg={BG.lavender}>
                    <ellipse cx="32" cy="56" rx="13" ry="3" fill="#ffffff" opacity="0.35" />
                    <path d="M27 15 H37 V25 Q46 31 45 42 Q44 54 32 55 Q20 54 19 42 Q18 31 27 25 Z"
                          fill="#eaf6ff" stroke="#9aa6c4" strokeWidth="1.3" />
                    <rect x="26" y="8" width="12" height="8" rx="3" fill="#c98b5e" stroke="#8a5836" strokeWidth="1" />
                    <path d="M22 36 Q20 45 22 49 Q26 54 32 54 Q38 54 42 49 Q44 45 42 36 Q37 40 32 40 Q27 40 22 36 Z"
                          fill="#b06bff" />
                    <Eyes y={44} gap={4.2} size={2.5} />
                    <Cheeks y={48} gap={8} color="#ffb3d1" opacity={0.5} />
                    <Smile y={49} w={2.2} color="#f4e6ff" />
                    <circle cx="26" cy="34" r="1.6" fill="#d9c2ff" opacity="0.8" />
                    <circle cx="39" cy="31" r="1.2" fill="#d9c2ff" opacity="0.7" />
                    <circle cx="37" cy="36" r="0.9" fill="#d9c2ff" opacity="0.7" />
                </Base>
            )

        case 'a-pirate':
            return (
                <Base bg={BG.aqua}>
                    <path d="M13 27 Q32 15 51 27 L49 32 Q32 22 15 32 Z" fill="#ff6b6b" stroke="#c94a4a" strokeWidth="1.2" />
                    <path d="M48 29 L57 26 L55 32 L58 36 L49 35 Z" fill="#ff6b6b" stroke="#c94a4a" strokeWidth="1.1" />
                    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M17 32 Q15 26 20 25 L44 25 Q49 26 47 32 Q32 27 17 32 Z" fill="#6b4a3a" />
                    <Eyes y={37} gap={5.4} size={3.2} />
                    <Cheeks y={42} gap={10} />
                    <Smile y={44} w={3} />
                    <circle cx="47" cy="39" r="1.6" fill="#ffd45c" stroke="#d99a2b" strokeWidth="0.7" />
                    <path d="M47 40.6 L47 43" stroke="#d99a2b" strokeWidth="1" />
                    <circle cx="24" cy="26" r="0.8" fill="#ffffff" opacity="0.7" />
                    <circle cx="38" cy="24" r="0.8" fill="#ffffff" opacity="0.7" />
                </Base>
            )

        case 'a-gargoyle':
            return (
                <Base bg={BG.slate}>
                    <path d="M14 30 Q4 24 9 14 Q14 22 22 25 Z" fill="#9a8ad0" stroke="#7a6ab0" strokeWidth="1.2" />
                    <path d="M50 30 Q60 24 55 14 Q50 22 42 25 Z" fill="#9a8ad0" stroke="#7a6ab0" strokeWidth="1.2" />
                    <path d="M19 26 L18 16 L27 22 Z" fill="#b7a8e0" stroke="#8a7ab8" strokeWidth="1.1" />
                    <path d="M45 26 L46 16 L37 22 Z" fill="#b7a8e0" stroke="#8a7ab8" strokeWidth="1.1" />
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#b7a8e0" stroke="#8a7ab8" strokeWidth="1.3" />
                    <Eyes y={36} gap={5.6} size={3.4} />
                    <Cheeks y={42} gap={10.5} color="#b79cff" opacity={0.45} />
                    <Smile y={44} w={3} />
                    <path d="M29 44 L29.8 46.7 L30.6 44 Z" fill="#ffffff" />
                    <path d="M33.4 44 L34.2 46.7 L35 44 Z" fill="#ffffff" />
                </Base>
            )

        case 'a-paper':
            return (
                <Base bg={BG.sky}>
                    <path d="M7 36 Q16 18 29 22" stroke="#ffffff" strokeWidth="1.8"
                          strokeDasharray="3 3" fill="none" opacity="0.85" />
                    <path d="M9 35 L55 16 L39 51 L32 38 Z" fill="#ffffff" stroke="#8fb8e0"
                          strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M39 51 L32 38 L55 16" fill="#eaf4ff" opacity="0.85" />
                    <path d="M32 38 L55 16" stroke="#c7ddf2" strokeWidth="1.1" />
                    <Eyes cx={26} y={31} gap={3.2} size={2.1} />
                    <Cheeks cx={26} y={35} gap={6.5} color="#ff8fb1" opacity={0.4} />
                    <Smile cx={26} y={36.5} w={2} />
                </Base>
            )

        case 'a-reaper':
            return (
                <Base bg={BG.lavender}>
                    <Star cx={49} cy={19} r={3} fill="#ffd45c" opacity={0.9} />
                    <path d="M15 36 Q15 15 32 15 Q49 15 49 36 L45 48 Q38 53 32 53 Q26 53 19 48 Z"
                          fill="#5a4a78" stroke="#3f3358" strokeWidth="1.3" />
                    <path d="M18 34 Q18 19 32 19 Q46 19 46 34 L44 41 Q38 45 32 45 Q26 45 20 41 Z"
                          fill="#3f3358" />
                    <ellipse cx="32" cy="36" rx="12" ry="11" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.1" />
                    <Eyes y={36} gap={4.8} size={2.9} />
                    <Cheeks y={41} gap={8.5} />
                    <Smile y={42} w={2.4} />
                </Base>
            )

        case 'a-pink-mon':
            return (
                <Base bg={BG.rose}>
                    <path d="M19 24 L17 13 L26 20 Z" fill="#ff8fbf" stroke="#d96b9e" strokeWidth="1.2" />
                    <path d="M45 24 L47 13 L38 20 Z" fill="#ff8fbf" stroke="#d96b9e" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="17" ry="16" fill="#ff8fbf" stroke="#d96b9e" strokeWidth="1.3" />
                    <path d="M28 22 Q32 18 36 22 Q32 24 28 22 Z" fill="#ffb3d1" />
                    <Eyes y={36} gap={5.6} size={3.4} />
                    <Cheeks y={43} gap={11} color="#ff5f9e" opacity={0.35} />
                    <path d="M26 45 Q32 50 38 45" stroke="#a83f72" strokeWidth="1.6"
                          fill="none" strokeLinecap="round" />
                    <path d="M28 45.5 L28.8 48 L29.6 45.5 Z" fill="#ffffff" />
                    <path d="M34.4 45.5 L35.2 48 L36 45.5 Z" fill="#ffffff" />
                </Base>
            )

        case 'a-mummy':
            return (
                <Base bg={BG.sand}>
                    <ellipse cx="32" cy="38" rx="16" ry="15" fill="#fff4df" stroke="#d9c3a0" strokeWidth="1.2" />
                    <path d="M17 27 Q32 22 47 27" stroke="#e8d3b0" strokeWidth="2.4" fill="none" />
                    <path d="M16 45 Q32 40 48 45" stroke="#e8d3b0" strokeWidth="2.4" fill="none" />
                    <path d="M20 51 Q32 47 44 51" stroke="#e8d3b0" strokeWidth="2.2" fill="none" />
                    <path d="M18 32 Q32 28 46 32" stroke="#f0dfc4" strokeWidth="1.6" fill="none" />
                    <Eyes y={37} gap={5.4} size={3.1} />
                    <Cheeks y={42} gap={9.8} />
                    <Smile y={44} w={2.6} />
                    <path d="M47 33 Q53 36 51 42 Q48 39 45 40" fill="#e8d3b0"
                          stroke="#d9c3a0" strokeWidth="1" strokeLinejoin="round" />
                </Base>
            )

        case 'a-board':
            return (
                <Base bg={BG.sand}>
                    <rect x="12" y="12" width="40" height="40" rx="6" fill="#f3e3c8" stroke="#c9a97a" strokeWidth="1.2" />
                    {Array.from({ length: 16 }).map((_, i) => {
                        const x = i % 4
                        const y = Math.floor(i / 4)
                        if ((x + y) % 2 === 0) return null
                        return <rect key={i} x={12 + x * 10} y={12 + y * 10} width="10" height="10"
                                     fill="#c99a6a" opacity="0.55" />
                    })}
                    <ellipse cx="32" cy="53" rx="12" ry="2.6" fill="#000000" opacity="0.12" />
                    <path d="M24 52 Q24 38 32 36 Q40 38 40 52 Z" fill="#fffaf0" stroke="#c9a97a" strokeWidth="1.2" />
                    <circle cx="32" cy="29" r="7" fill="#fffaf0" stroke="#c9a97a" strokeWidth="1.2" />
                    <rect x="22" y="51" width="20" height="4" rx="2" fill="#fffaf0" stroke="#c9a97a" strokeWidth="1.1" />
                    <Eyes y={28} gap={4} size={2.4} />
                    <Cheeks y={32} gap={7} color="#ffb3b3" opacity={0.5} />
                    <Smile y={33} w={2} />
                </Base>
            )

        case 'a-lama':
            return (
                <Base bg={BG.lemon}>
                    <path d="M19 28 Q14 14 21 12 Q26 16 26 26 Z" fill="#f7e3c3" stroke="#c9a97a" strokeWidth="1.2" />
                    <path d="M45 28 Q50 14 43 12 Q38 16 38 26 Z" fill="#f7e3c3" stroke="#c9a97a" strokeWidth="1.2" />
                    <ellipse cx="32" cy="37" rx="15" ry="14" fill="#f7e3c3" stroke="#c9a97a" strokeWidth="1.3" />
                    <path d="M20 27 Q22 20 32 20 Q42 20 44 27 Q38 24 32 25 Q26 24 20 27 Z" fill="#fff6e7" />
                    <ellipse cx="32" cy="44" rx="8" ry="5.5" fill="#fff6e7" />
                    <Eyes y={35} gap={5.6} size={3.1} />
                    <Cheeks y={41} gap={10} />
                    <ellipse cx="29.5" cy="44" rx="1.1" ry="0.7" fill="#c9a97a" />
                    <ellipse cx="34.5" cy="44" rx="1.1" ry="0.7" fill="#c9a97a" />
                    <Smile y={46.5} w={2} />
                </Base>
            )

        case 'a-ghost':
            return (
                <Base bg={BG.indigo}>
                    <path d="M17 40 Q17 17 32 17 Q47 17 47 40 L46 51 Q43 48 40 51 Q37 54 34 51 Q31 48 28 51 Q25 54 22 51 Q19 48 17 51 Z"
                          fill="#fffafd" stroke="#d9d2ea" strokeWidth="1.3" />
                    <ellipse cx="14" cy="38" rx="3" ry="2" fill="#fffafd" stroke="#d9d2ea"
                             strokeWidth="1" transform="rotate(-20 14 38)" />
                    <ellipse cx="50" cy="38" rx="3" ry="2" fill="#fffafd" stroke="#d9d2ea"
                             strokeWidth="1" transform="rotate(20 50 38)" />
                    <Eyes y={35} gap={5.6} size={3.3} />
                    <Cheeks y={41} gap={10} color="#b79cff" opacity={0.45} />
                    <Smile y={43} w={3} open />
                    <Star cx={52} cy={15} r={2.3} fill="#ffffff" opacity={0.75} />
                </Base>
            )

        case 'a-squirrel':
            return (
                <Base bg={BG.peach}>
                    <path d="M46 48 Q60 42 57 25 Q55 14 46 17 Q55 24 51 33 Q48 40 43 44 Z"
                          fill="#d9864a" stroke="#a35f2e" strokeWidth="1.2" />
                    <path d="M18 27 Q16 16 22 17 Q27 20 26 27 Z" fill="#e39a5c" stroke="#a35f2e" strokeWidth="1.1" />
                    <path d="M46 27 Q48 16 42 17 Q37 20 38 27 Z" fill="#e39a5c" stroke="#a35f2e" strokeWidth="1.1" />
                    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#e39a5c" stroke="#a35f2e" strokeWidth="1.3" />
                    <ellipse cx="32" cy="44" rx="8" ry="5.5" fill="#f6dcc0" />
                    <Eyes y={35} gap={5.6} size={3.1} />
                    <Cheeks y={41} gap={10} />
                    <ellipse cx="32" cy="42" rx="2" ry="1.5" fill="#5b3a2a" />
                    <path d="M32 43.5 L32 45 M29 46 Q32 48.5 35 46" stroke="#5b3a2a"
                          strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    <circle cx="43" cy="20" r="2.2" fill="#c98552" stroke="#a35f2e" strokeWidth="0.8" />
                </Base>
            )

        case 'a-donkey':
            return (
                <Base bg={BG.mint}>
                    <path d="M19 28 Q14 12 22 12 Q28 18 27 28 Z" fill="#d7dbe8" stroke="#8f97b0" strokeWidth="1.2" />
                    <path d="M45 28 Q50 12 42 12 Q36 18 37 28 Z" fill="#d7dbe8" stroke="#8f97b0" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#d7dbe8" stroke="#8f97b0" strokeWidth="1.3" />
                    <path d="M22 24 Q24 20 32 20 Q40 20 42 24" fill="#8f97b0" />
                    <ellipse cx="32" cy="45" rx="9" ry="6" fill="#eef0f7" />
                    <Eyes y={36} gap={5.6} size={3.1} />
                    <Cheeks y={42} gap={10} />
                    <ellipse cx="29.5" cy="45" rx="1.1" ry="0.7" fill="#8f97b0" />
                    <ellipse cx="34.5" cy="45" rx="1.1" ry="0.7" fill="#8f97b0" />
                    <Smile y={47.5} w={2.2} />
                </Base>
            )

        case 'a-dog':
            return (
                <Base bg={BG.peach}>
                    <ellipse cx="17" cy="31" rx="5.5" ry="11" fill="#8a5b3a" stroke="#5b3a24"
                             strokeWidth="1.1" transform="rotate(15 17 31)" />
                    <ellipse cx="47" cy="31" rx="5.5" ry="11" fill="#8a5b3a" stroke="#5b3a24"
                             strokeWidth="1.1" transform="rotate(-15 47 31)" />
                    <ellipse cx="32" cy="38" rx="16" ry="14.5" fill="#d9a56f" stroke="#a0714a" strokeWidth="1.3" />
                    <ellipse cx="25" cy="30" rx="5.5" ry="4.5" fill="#a0714a" opacity="0.45" />
                    <ellipse cx="32" cy="44" rx="9" ry="6" fill="#f6e3c8" />
                    <Eyes y={36} gap={5.6} size={3.1} />
                    <Cheeks y={42} gap={10.5} />
                    <ellipse cx="32" cy="41" rx="2.4" ry="1.8" fill="#3b2b2a" />
                    <path d="M26 45 Q32 50 38 45" stroke="#6b4351" strokeWidth="1.5"
                          fill="none" strokeLinecap="round" />
                    <path d="M30 46 Q32 52 34 46 Z" fill="#ff9eb5" />
                </Base>
            )

        case 'a-raccoon':
            return (
                <Base bg={BG.indigo}>
                    <path d="M17 27 Q14 15 21 16 Q26 20 25 27 Z" fill="#8f97b0" stroke="#5b6378" strokeWidth="1.1" />
                    <path d="M47 27 Q50 15 43 16 Q38 20 39 27 Z" fill="#8f97b0" stroke="#5b6378" strokeWidth="1.1" />
                    <ellipse cx="32" cy="38" rx="16" ry="14.5" fill="#a9b0c4" stroke="#5b6378" strokeWidth="1.3" />
                    <ellipse cx="25" cy="33" rx="7" ry="5.2" fill="#4a5164" transform="rotate(-10 25 33)" />
                    <ellipse cx="39" cy="33" rx="7" ry="5.2" fill="#4a5164" transform="rotate(10 39 33)" />
                    <circle cx="26" cy="33" r="3.4" fill="#ffffff" />
                    <circle cx="38" cy="33" r="3.4" fill="#ffffff" />
                    <circle cx="26" cy="33" r="2" fill={INK} />
                    <circle cx="38" cy="33" r="2" fill={INK} />
                    <circle cx="25.2" cy="32.2" r="0.7" fill="#ffffff" />
                    <circle cx="37.2" cy="32.2" r="0.7" fill="#ffffff" />
                    <ellipse cx="32" cy="44" rx="8" ry="5.5" fill="#eef0f7" />
                    <Cheeks y={41} gap={11} color="#ff9ecb" opacity={0.3} />
                    <ellipse cx="32" cy="42" rx="2" ry="1.5" fill="#3b2b3a" />
                    <Smile y={45.5} w={2.4} />
                </Base>
            )

        case 'a-cupcake':
            return (
                <Base bg={BG.rose}>
                    <path d="M19 38 L45 38 L41 55 Q32 58 23 55 Z" fill="#ff9ecb" stroke="#d96b9e" strokeWidth="1.2" />
                    <path d="M25 39 L23 55 M32 39 L32 57 M39 39 L41 55" stroke="#ffd1e6" strokeWidth="2" opacity="0.8" />
                    <path d="M15 38 Q13 29 21 28 Q19 18 29 21 Q32 10 40 21 Q51 18 49 29 Q56 32 49 38 Z"
                          fill="#fff4e8" stroke="#e0c9b8" strokeWidth="1.2" />
                    <circle cx="40" cy="14" r="4" fill="#ff6b6b" stroke="#c94a4a" strokeWidth="1" />
                    <path d="M40 10 Q41 6 44 7" stroke="#5fa348" strokeWidth="1.5" fill="none" />
                    <Eyes y={31} gap={5} size={3} />
                    <Cheeks y={36} gap={9.5} />
                    <Smile y={38} w={2.6} />
                    <path d="M23 27 L25 24 M38 26 L41 23 M34 20 L36 17" stroke="#8fd3ff" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="45" cy="31" r="1" fill="#ffd45c" />
                    <circle cx="20" cy="33" r="1" fill="#7ec86a" />
                </Base>
            )

        case 'a-piggy':
            return (
                <Base bg={BG.rose}>
                    <path d="M18 26 Q14 16 22 18 Q27 21 26 28 Z" fill="#ff9ecb" stroke="#d96b9e" strokeWidth="1.2" />
                    <path d="M46 26 Q50 16 42 18 Q37 21 38 28 Z" fill="#ff9ecb" stroke="#d96b9e" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="16" ry="15" fill="#ffb3d1" stroke="#d96b9e" strokeWidth="1.3" />
                    <ellipse cx="32" cy="44" rx="8" ry="6" fill="#ff8fbf" stroke="#d96b9e" strokeWidth="1.1" />
                    <circle cx="29" cy="44" r="1.2" fill="#a83f72" />
                    <circle cx="35" cy="44" r="1.2" fill="#a83f72" />
                    <Eyes y={35} gap={6} size={3.1} />
                    <Cheeks y={40} gap={11} color="#ff5f9e" opacity={0.3} />
                    <Smile y={49} w={2} />
                </Base>
            )

        case 'a-penguin':
            return (
                <Base bg={BG.ice}>
                    <ellipse cx="32" cy="36" rx="17" ry="18" fill="#3b4a63" stroke="#2a3148" strokeWidth="1.3" />
                    <ellipse cx="32" cy="40" rx="12" ry="13" fill="#f6f8ff" />
                    <Eyes y={35} gap={5} size={3} />
                    <Cheeks y={40} gap={9} color="#ff9ecb" opacity={0.35} />
                    <path d="M28 41 L32 45 L36 41 Z" fill="#ffb46b" stroke="#d98a3a" strokeWidth="1" />
                    <path d="M16 49 Q32 45 48 49 L47 53 Q32 50 17 53 Z" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="1.1" />
                    <path d="M46 51 L52 58 L48 58 L45 54 Z" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="1" />
                    <ellipse cx="15" cy="52" rx="4" ry="2.4" fill="#ffb46b" stroke="#d98a3a" strokeWidth="0.9" />
                    <ellipse cx="49" cy="52" rx="4" ry="2.4" fill="#ffb46b" stroke="#d98a3a" strokeWidth="0.9" />
                </Base>
            )

        case 'a-astronaut':
            return (
                <Base bg={BG.navy}>
                    <Star cx={11} cy={20} r={2.2} fill="#ffffff" opacity={0.7} />
                    <Star cx={53} cy={13} r={2.8} fill="#ffd45c" opacity={0.8} />
                    <Star cx={55} cy={44} r={1.7} fill="#ffffff" opacity={0.6} />
                    <circle cx="32" cy="33" r="20" fill="#f6f8ff" stroke="#b8c2d8" strokeWidth="1.4" />
                    <ellipse cx="32" cy="35" rx="15" ry="13" fill="#7f8fd6" stroke="#5a6a9e" strokeWidth="1.2" />
                    <ellipse cx="26" cy="28" rx="6" ry="3" fill="#ffffff" opacity="0.18" />
                    <ellipse cx="32" cy="37" rx="11" ry="10" fill="#ffe0c2" />
                    <Eyes y={36} gap={4.4} size={2.6} />
                    <Cheeks y={40} gap={8} />
                    <Smile y={41.5} w={2.2} />
                    <path d="M18 52 Q32 46 46 52 L44 57 Q32 53 20 57 Z" fill="#eaf4ff" stroke="#b8c2d8" strokeWidth="1.1" />
                    <rect x="26" y="51" width="12" height="6" rx="3" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="0.9" />
                </Base>
            )

        case 'a-burger':
            return (
                <Base bg={BG.lemon}>
                    <path d="M12 30 Q14 12 32 12 Q50 12 52 30 Z" fill="#f0b95c" stroke="#c9852e" strokeWidth="1.3" />
                    <ellipse cx="23" cy="20" rx="1.6" ry="0.9" fill="#fff4df" />
                    <ellipse cx="32" cy="17" rx="1.6" ry="0.9" fill="#fff4df" />
                    <ellipse cx="41" cy="21" rx="1.6" ry="0.9" fill="#fff4df" />
                    <ellipse cx="38" cy="26" rx="1.4" ry="0.8" fill="#fff4df" />
                    <ellipse cx="26" cy="26" rx="1.4" ry="0.8" fill="#fff4df" />
                    <path d="M12 30 Q32 25 52 30 L52 34 Q32 29 12 34 Z" fill="#7ec86a" stroke="#5fa348" strokeWidth="1" />
                    <path d="M12 34 L52 34 L48 40 L44 36 L40 41 L36 36 L32 41 L28 36 L24 41 L20 36 L16 40 Z"
                          fill="#ffd45c" stroke="#d99a2b" strokeWidth="1" />
                    <rect x="14" y="40" width="36" height="7" rx="3.5" fill="#a35f2e" stroke="#7a3f1f" strokeWidth="1" />
                    <path d="M12 47 Q32 57 52 47 Q50 54 32 55 Q14 54 12 47 Z"
                          fill="#e8a94a" stroke="#c9852e" strokeWidth="1.2" />
                    <Eyes y={23} gap={5} size={2.7} />
                    <Cheeks y={27} gap={9} color="#ff8f8f" opacity={0.35} />
                    <Smile y={29} w={2.4} />
                </Base>
            )

        case 'a-bee':
            return (
                <Base bg={BG.honey}>
                    <ellipse cx="20" cy="27" rx="8" ry="5" fill="#eaf8ff" opacity="0.85"
                             stroke="#9fd7ea" strokeWidth="1.1" transform="rotate(-20 20 27)" />
                    <ellipse cx="44" cy="27" rx="8" ry="5" fill="#eaf8ff" opacity="0.85"
                             stroke="#9fd7ea" strokeWidth="1.1" transform="rotate(20 44 27)" />
                    <path d="M26 24 Q24 18 20 17 M38 24 Q40 18 44 17" stroke="#3b2b3a"
                          strokeWidth="1.4" fill="none" strokeLinecap="round" />
                    <circle cx="20" cy="17" r="1.4" fill="#3b2b3a" />
                    <circle cx="44" cy="17" r="1.4" fill="#3b2b3a" />
                    <ellipse cx="32" cy="38" rx="15" ry="12" fill="#ffd45c" stroke="#b8872a" strokeWidth="1.3" />
                    <path d="M22 30 Q20 38 23 46" stroke="#3b2b3a" strokeWidth="3" fill="none" />
                    <path d="M32 27 L32 49" stroke="#3b2b3a" strokeWidth="3" fill="none" />
                    <path d="M42 30 Q44 38 41 46" stroke="#3b2b3a" strokeWidth="3" fill="none" />
                    <Eyes y={36} gap={5.4} size={3.1} />
                    <Cheeks y={41} gap={9.5} color="#ff8f8f" opacity={0.4} />
                    <Smile y={43} w={2.6} />
                </Base>
            )

        case 'a-zombie':
            return (
                <Base bg={BG.mint}>
                    <ellipse cx="32" cy="38" rx="16" ry="15" fill="#b6e6a2" stroke="#7fae6a" strokeWidth="1.3" />
                    <path d="M20 25 Q24 18 32 20 Q40 18 44 25 Q38 23 32 24 Q26 23 20 25 Z" fill="#4a5b3a" />
                    <Eyes y={36} gap={5.6} size={3.1} />
                    <Cheeks y={42} gap={10} color="#7fae6a" opacity={0.45} />
                    <Smile y={44} w={3} open />
                    <path d="M31 45 L31 47.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M44 34 L47 33 M44 37 L47 38" stroke="#5b7a4a" strokeWidth="1" strokeLinecap="round" />
                    <path d="M21 34 L18 33 M21 37 L18 38" stroke="#5b7a4a" strokeWidth="1" strokeLinecap="round" />
                </Base>
            )

        case 'cat-pilot':
            return (
                <Base bg={BG.sky}>
                    <path d="M18 26 L14 12 L28 20 Z" fill="#e8a55c" stroke="#b87a3a" strokeWidth="1.2" />
                    <path d="M46 26 L50 12 L36 20 Z" fill="#e8a55c" stroke="#b87a3a" strokeWidth="1.2" />
                    <path d="M20 24 L18 16 L25 20 Z" fill="#ffd1e6" />
                    <path d="M44 24 L46 16 L39 20 Z" fill="#ffd1e6" />
                    <ellipse cx="32" cy="39" rx="16" ry="14" fill="#f0b97a" stroke="#b87a3a" strokeWidth="1.3" />
                    <path d="M16 30 Q18 16 32 16 Q46 16 48 30 Q32 24 16 30 Z" fill="#8a5b3a" stroke="#5b3a24" strokeWidth="1.1" />
                    <path d="M17 29 Q32 23 47 29" stroke="#5b3a24" strokeWidth="1.2" fill="none" />
                    <circle cx="26" cy="27" r="4.2" fill="#7fd9d1" stroke="#4a9aa0" strokeWidth="1.3" />
                    <circle cx="38" cy="27" r="4.2" fill="#7fd9d1" stroke="#4a9aa0" strokeWidth="1.3" />
                    <path d="M30 27 L34 27" stroke="#4a9aa0" strokeWidth="1.3" />
                    <circle cx="24.8" cy="25.6" r="1.1" fill="#ffffff" opacity="0.85" />
                    <circle cx="36.8" cy="25.6" r="1.1" fill="#ffffff" opacity="0.85" />
                    <Eyes y={38} gap={5.6} size={3.2} />
                    <Cheeks y={43} gap={10} />
                    <path d="M29 43 Q32 46 35 43" stroke="#8a5b3a" strokeWidth="1.4"
                          fill="none" strokeLinecap="round" />
                    <path d="M22 40 L16 39 M22 43 L16 44 M42 40 L48 39 M42 43 L48 44"
                          stroke="#8a5b3a" strokeWidth="0.9" strokeLinecap="round" />
                    <path d="M38 47 L46 51 L42 53 Z" fill="#ff7b7b" stroke="#c94a4a" strokeWidth="0.8" />
                </Base>
            )

        case 'a-alien':
            return (
                <Base bg={BG.mint}>
                    <path d="M25 20 Q22 12 18 10" stroke="#7fae6a" strokeWidth="1.6" fill="none" />
                    <circle cx="18" cy="9" r="2" fill="#b6e6a2" stroke="#7fae6a" strokeWidth="1" />
                    <path d="M39 20 Q42 12 46 10" stroke="#7fae6a" strokeWidth="1.6" fill="none" />
                    <circle cx="46" cy="9" r="2" fill="#b6e6a2" stroke="#7fae6a" strokeWidth="1" />
                    <ellipse cx="32" cy="36" rx="17" ry="18" fill="#b6e6a2" stroke="#7fae6a" strokeWidth="1.3" />
                    <ellipse cx="25" cy="35" rx="4.5" ry="6" fill="#3b2b3a" transform="rotate(-12 25 35)" />
                    <ellipse cx="39" cy="35" rx="4.5" ry="6" fill="#3b2b3a" transform="rotate(12 39 35)" />
                    <circle cx="23.8" cy="32.5" r="1.4" fill="#ffffff" />
                    <circle cx="37.8" cy="32.5" r="1.4" fill="#ffffff" />
                    <Cheeks y={44} gap={10} color="#7ec86a" opacity={0.5} />
                    <Smile y={45} w={2.2} />
                </Base>
            )

        case 'a-pirate2':
            return (
                <Base bg={BG.indigo}>
                    <path d="M10 27 Q14 13 32 13 Q50 13 54 27 Q44 22 32 24 Q20 22 10 27 Z"
                          fill="#3f4a6b" stroke="#2a3148" strokeWidth="1.3" />
                    <path d="M14 24 L18 15 L24 21" fill="none" stroke="#ffd45c" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M50 24 L46 15 L40 21" fill="none" stroke="#ffd45c" strokeWidth="1.4" strokeLinejoin="round" />
                    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#ffe0c2" stroke="#d9a07c" strokeWidth="1.2" />
                    <path d="M17 32 Q15 26 20 25 L44 25 Q49 26 47 32 Q32 27 17 32 Z" fill="#6b4a3a" />
                    <path d="M18 37 Q14 40 15 46" stroke="#6b4a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <Eyes y={37} gap={5.4} size={3.1} />
                    <Cheeks y={42} gap={10} />
                    <Smile y={44} w={3} />
                </Base>
            )

        case 'a-hook':
            return (
                <Base bg={BG.aqua}>
                    <circle cx="32" cy="30" r="16" fill="#eaf8ff" opacity="0.35" />
                    <path d="M34 10 L34 34 Q34 48 24 48 Q16 48 16 41 Q16 35 23 35 Q28 35 28 40"
                          fill="none" stroke="#c7d2e0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M34 10 L34 34 Q34 48 24 48 Q16 48 16 41 Q16 35 23 35 Q28 35 28 40"
                          fill="none" stroke="#f6f8ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="30" y="10" width="8" height="6" rx="3" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1" />
                    <Eyes cx={34} y={23} gap={4} size={2.4} />
                    <Cheeks cx={34} y={28} gap={7} color="#ff9ecb" opacity={0.4} />
                    <Smile cx={34} y={29} w={2} />
                    <Star cx={48} cy={18} r={3} fill="#ffffff" opacity={0.85} />
                </Base>
            )

        case 'a-clown':
            return (
                <Base bg={BG.sky}>
                    <g stroke="#d96b9e" strokeWidth="1">
                        <circle cx="18" cy="26" r="7" fill="#ff8fbf" />
                        <circle cx="46" cy="26" r="7" fill="#8fd3ff" />
                        <circle cx="20" cy="18" r="6" fill="#ffd45c" />
                        <circle cx="44" cy="18" r="6" fill="#b79cff" />
                        <circle cx="32" cy="15" r="7" fill="#7ec86a" />
                    </g>
                    <ellipse cx="32" cy="38" rx="14" ry="13" fill="#fff4ec" stroke="#d9c3b0" strokeWidth="1.2" />
                    <path d="M18 31 Q22 23 32 23 Q42 23 46 31" fill="none" stroke="#ffd45c" strokeWidth="2" />
                    <Eyes y={35} gap={5.4} size={3.2} />
                    <Cheeks y={41} gap={10} color="#ff6b6b" opacity={0.35} />
                    <circle cx="32" cy="41" r="3" fill="#ff5f6b" stroke="#c94a4a" strokeWidth="0.9" />
                    <path d="M25 45 Q32 51 39 45" stroke="#c94a4a" strokeWidth="1.7"
                          fill="none" strokeLinecap="round" />
                    <path d="M20 10 L32 3 L44 10 Z" fill="#ffd45c" stroke="#d99a2b" strokeWidth="1.1" />
                    <circle cx="32" cy="3" r="2" fill="#ff6b6b" />
                </Base>
            )





        default:
            return null
    }
}
