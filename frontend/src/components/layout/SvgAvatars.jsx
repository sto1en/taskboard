// SVG-аватарки в стиле «мультяшные персонажи в круге».
// code совпадает с кодом аватарки в БД (a-wizard, a-zombie, ...).

const BG = {
    blue:   '#7eb6ff',
    purple: '#b28cff',
    green:  '#9ee493',
    red:    '#ff8f8f',
    orange: '#ffb46b',
    pink:   '#ff9ecb',
    teal:   '#7fd9d1',
    yellow: '#ffe066',
    gray:   '#c7ccd4',
    dark:   '#4d5662',
}

function Base({ bg, children }) {
    return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill={bg} />
            {children}
        </svg>
    )
}

export function SvgAvatar({ code }) {
    switch (code) {
        case 'a-wizard':
            return (
                <Base bg={BG.purple}>
                    <path d="M18 28 L32 6 L46 28 Z" fill="#3a2d80" stroke="#221a4d" strokeWidth="1.4" />
                    <ellipse cx="32" cy="28" rx="18" ry="3.4" fill="#221a4d" />
                    <ellipse cx="32" cy="42" rx="13" ry="12" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <path d="M20 36 Q26 42 32 36 Q38 42 44 36" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <circle cx="26" cy="41" r="1.6" fill="#1d1d1d" />
                    <circle cx="38" cy="41" r="1.6" fill="#1d1d1d" />
                    <circle cx="46" cy="34" r="1.6" fill="#ffe066" />
                </Base>
            )
        case 'a-devil':
            return (
                <Base bg={BG.red}>
                    <path d="M20 18 L24 6 L30 16 Z" fill="#b71c1c" />
                    <path d="M44 18 L40 6 L34 16 Z" fill="#b71c1c" />
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#d94b4b" stroke="#7a1a1a" strokeWidth="1.4" />
                    <circle cx="25" cy="34" r="2.4" fill="#1d1d1d" />
                    <circle cx="39" cy="34" r="2.4" fill="#1d1d1d" />
                    <circle cx="25.6" cy="33" r="0.8" fill="#fff" />
                    <circle cx="39.6" cy="33" r="0.8" fill="#fff" />
                    <path d="M26 44 Q32 48 38 44" stroke="#1d1d1d" strokeWidth="1.4" fill="none" />
                    <path d="M28 44 L26 47 M36 44 L38 47" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
                </Base>
            )
        case 'a-viking':
            return (
                <Base bg={BG.teal}>
                    <path d="M18 26 L14 14 L24 20 Z" fill="#6b4a2b" stroke="#3a2414" strokeWidth="1" />
                    <path d="M46 26 L50 14 L40 20 Z" fill="#6b4a2b" stroke="#3a2414" strokeWidth="1" />
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <path d="M16 34 Q32 46 48 34 Q46 52 32 52 Q18 52 16 34 Z" fill="#e0a86a" stroke="#8b4a1f" strokeWidth="1.2" />
                    <circle cx="25" cy="34" r="1.8" fill="#1d1d1d" />
                    <circle cx="39" cy="34" r="1.8" fill="#1d1d1d" />
                </Base>
            )
        case 'a-unicorn':
            return (
                <Base bg={BG.pink}>
                    <ellipse cx="32" cy="38" rx="17" ry="14" fill="#fff" stroke="#c7c0d4" strokeWidth="1.4" />
                    <path d="M32 12 L36 26 L28 26 Z" fill="#ffe066" stroke="#c79e00" strokeWidth="1.2" />
                    <path d="M18 30 Q12 22 16 18 Q22 22 24 26 Z" fill="#a96cff" />
                    <path d="M46 30 Q52 22 48 18 Q42 22 40 26 Z" fill="#6cd0ff" />
                    <circle cx="25" cy="38" r="2" fill="#1d1d1d" />
                    <circle cx="39" cy="38" r="2" fill="#1d1d1d" />
                    <ellipse cx="32" cy="46" rx="2.4" ry="1.6" fill="#ff9bd0" />
                </Base>
            )
        case 'a-pizza':
            return (
                <Base bg={BG.yellow}>
                    <path d="M32 12 L52 48 L12 48 Z" fill="#f5b642" stroke="#8a6400" strokeWidth="1.6" />
                    <circle cx="26" cy="38" r="2" fill="#d94848" />
                    <circle cx="38" cy="38" r="2" fill="#d94848" />
                    <circle cx="32" cy="30" r="2" fill="#d94848" />
                    <circle cx="22" cy="44" r="1.4" fill="#5a9f3a" />
                    <circle cx="42" cy="44" r="1.4" fill="#5a9f3a" />
                </Base>
            )
        case 'a-bear':
            return (
                <Base bg={BG.orange}>
                    <circle cx="18" cy="24" r="7" fill="#8a5b32" stroke="#5a3818" strokeWidth="1.2" />
                    <circle cx="46" cy="24" r="7" fill="#8a5b32" stroke="#5a3818" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#a8763a" stroke="#5a3818" strokeWidth="1.4" />
                    <ellipse cx="32" cy="44" rx="6" ry="4.4" fill="#f0d6b4" />
                    <circle cx="25" cy="36" r="1.8" fill="#1d1d1d" />
                    <circle cx="39" cy="36" r="1.8" fill="#1d1d1d" />
                    <ellipse cx="32" cy="42" rx="2.4" ry="1.6" fill="#1d1d1d" />
                </Base>
            )
        case 'a-lightning':
            return (
                <Base bg={BG.dark}>
                    <path d="M36 6 L22 34 L30 34 L26 58 L44 28 L34 28 Z" fill="#ffe066" stroke="#c79e00" strokeWidth="1.4" />
                </Base>
            )
        case 'a-sunflower':
            return (
                <Base bg={BG.green}>
                    {Array.from({ length: 8 }).map((_, i) => {
                        const a = (i * 45) * Math.PI / 180
                        const cx = 32 + Math.cos(a) * 14
                        const cy = 32 + Math.sin(a) * 14
                        return <ellipse key={i} cx={cx} cy={cy} rx="5" ry="8"
                                        transform={`rotate(${i * 45} ${cx} ${cy})`}
                                        fill="#ffe066" stroke="#c79e00" strokeWidth="1" />
                    })}
                    <circle cx="32" cy="32" r="9" fill="#8b5a2b" stroke="#4a2f18" strokeWidth="1.2" />
                </Base>
            )
        case 'a-rocket':
            return (
                <Base bg={BG.dark}>
                    <path d="M32 8 C40 18 42 30 38 44 L26 44 C22 30 24 18 32 8 Z"
                          fill="#e0e6ed" stroke="#6b778c" strokeWidth="1.4" />
                    <circle cx="32" cy="24" r="4" fill="#4c9aff" stroke="#0052cc" strokeWidth="1.2" />
                    <path d="M22 40 L16 50 L26 46 Z" fill="#ff5630" />
                    <path d="M42 40 L48 50 L38 46 Z" fill="#ff5630" />
                    <path d="M30 48 L32 58 L34 48 Z" fill="#ffab00" />
                </Base>
            )
        case 'a-soccer':
            return (
                <Base bg={BG.green}>
                    <circle cx="32" cy="32" r="20" fill="#fff" stroke="#1d1d1d" strokeWidth="1.6" />
                    <polygon points="32,20 40,26 37,36 27,36 24,26" fill="#1d1d1d" />
                    <polygon points="32,6 40,12 34,16" fill="#1d1d1d" />
                    <polygon points="46,18 42,26 36,24" fill="#1d1d1d" />
                    <polygon points="18,18 22,26 28,24" fill="#1d1d1d" />
                    <polygon points="28,52 36,52 34,46 30,46" fill="#1d1d1d" />
                </Base>
            )
        case 'a-ninja':
            return (
                <Base bg={BG.dark}>
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#1d1d1d" />
                    <rect x="16" y="34" width="32" height="6" fill="#ffd54f" />
                    <ellipse cx="25" cy="37" rx="2" ry="2" fill="#4ce6c1" />
                    <ellipse cx="39" cy="37" rx="2" ry="2" fill="#4ce6c1" />
                </Base>
            )
        case 'a-skull':
            return (
                <Base bg={BG.dark}>
                    <path d="M18 28 Q18 12 32 12 Q46 12 46 28 L46 40 Q46 46 40 46 L38 52 L26 52 L24 46 Q18 46 18 40 Z"
                          fill="#f4f4f4" stroke="#1d1d1d" strokeWidth="1.4" />
                    <circle cx="26" cy="30" r="3" fill="#1d1d1d" />
                    <circle cx="38" cy="30" r="3" fill="#1d1d1d" />
                    <path d="M29 42 L31 38 L33 42 L35 38 L37 42" stroke="#1d1d1d" strokeWidth="1.4" fill="none" />
                </Base>
            )
        case 'a-shark':
            return (
                <Base bg={BG.blue}>
                    <path d="M8 40 Q20 20 40 22 Q54 22 58 34 Q50 36 46 42 Q40 48 30 46 Z"
                          fill="#4c9aff" stroke="#0a4a9c" strokeWidth="1.4" />
                    <path d="M20 34 L24 26 L28 34" fill="#0a4a9c" />
                    <path d="M24 44 Q28 50 22 50 Q18 48 24 44 Z" fill="#4c9aff" stroke="#0a4a9c" strokeWidth="1.2" />
                    <circle cx="46" cy="30" r="1.6" fill="#1d1d1d" />
                    <path d="M24 40 L28 42 L24 44" stroke="#fff" strokeWidth="1.4" fill="none" />
                </Base>
            )
        case 'a-leprechaun':
            return (
                <Base bg={BG.green}>
                    <path d="M18 26 L32 6 L46 26 Z" fill="#2c6b2c" stroke="#1a3a1a" strokeWidth="1.4" />
                    <rect x="16" y="24" width="32" height="4" fill="#1a3a1a" />
                    <ellipse cx="32" cy="42" rx="15" ry="14" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <path d="M24 42 Q28 40 32 44 Q36 40 40 42 Q40 48 32 48 Q24 48 24 42 Z"
                          fill="#c9b8a1" stroke="#6b5744" strokeWidth="1" />
                    <circle cx="26" cy="38" r="1.6" fill="#1d1d1d" />
                    <circle cx="38" cy="38" r="1.6" fill="#1d1d1d" />
                </Base>
            )
        case 'a-queen':
            return (
                <Base bg={BG.red}>
                    <path d="M18 28 L20 14 L26 24 L32 12 L38 24 L44 14 L46 28 Z"
                          fill="#ffe066" stroke="#c79e00" strokeWidth="1.4" />
                    <ellipse cx="32" cy="40" rx="15" ry="14" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <circle cx="26" cy="38" r="1.6" fill="#1d1d1d" />
                    <circle cx="38" cy="38" r="1.6" fill="#1d1d1d" />
                    <path d="M28 46 Q32 48 36 46" stroke="#d94b4b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </Base>
            )
        case 'a-potion':
            return (
                <Base bg={BG.purple}>
                    <rect x="26" y="10" width="12" height="6" fill="#8a6400" />
                    <path d="M26 16 L20 28 Q18 44 32 50 Q46 44 44 28 L38 16 Z"
                          fill="#ffffff" stroke="#4a2f18" strokeWidth="1.4" />
                    <path d="M22 32 Q20 44 32 48 Q44 44 42 32 Z" fill="#a45cd6" />
                    <circle cx="28" cy="38" r="1.4" fill="#fff" />
                    <circle cx="36" cy="42" r="1" fill="#fff" />
                </Base>
            )
        case 'a-pirate':
            return (
                <Base bg={BG.dark}>
                    <path d="M12 24 Q32 8 52 24 Q46 22 42 24 Q32 20 22 24 Q18 22 12 24 Z"
                          fill="#1d1d1d" stroke="#4d5662" strokeWidth="1.2" />
                    <ellipse cx="32" cy="40" rx="15" ry="14" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <circle cx="26" cy="40" r="1.8" fill="#1d1d1d" />
                    <path d="M36 34 L44 30" stroke="#1d1d1d" strokeWidth="1.4" />
                    <rect x="34" y="33" width="10" height="6" rx="2" fill="#1d1d1d" />
                    <circle cx="39" cy="36" r="1.2" fill="#fff" />
                </Base>
            )
        case 'a-gargoyle':
            return (
                <Base bg={BG.gray}>
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#6b778c" stroke="#38414a" strokeWidth="1.4" />
                    <path d="M18 22 L20 14 L26 22 Z" fill="#6b778c" stroke="#38414a" strokeWidth="1.2" />
                    <path d="M46 22 L44 14 L38 22 Z" fill="#6b778c" stroke="#38414a" strokeWidth="1.2" />
                    <circle cx="26" cy="36" r="2" fill="#ff5630" />
                    <circle cx="38" cy="36" r="2" fill="#ff5630" />
                    <path d="M26 46 L32 48 L38 46" stroke="#38414a" strokeWidth="1.4" fill="none" />
                </Base>
            )
        case 'a-paper':
            return (
                <Base bg={BG.blue}>
                    <path d="M10 40 L52 20 L42 34 L50 40 L40 42 L36 50 L30 40 Z"
                          fill="#fff" stroke="#4c9aff" strokeWidth="1.4" />
                </Base>
            )
        case 'a-reaper':
            return (
                <Base bg={BG.dark}>
                    <path d="M16 30 Q32 12 48 30 Q46 40 42 44 L38 48 L32 46 L26 48 L22 44 Q18 40 16 30 Z"
                          fill="#1d1d1d" stroke="#4d5662" strokeWidth="1.4" />
                    <circle cx="26" cy="34" r="2" fill="#4ce6c1" />
                    <circle cx="38" cy="34" r="2" fill="#4ce6c1" />
                    <path d="M28 44 L32 48 L36 44" stroke="#4ce6c1" strokeWidth="1.2" fill="none" />
                </Base>
            )
        case 'a-pink-mon':
            return (
                <Base bg={BG.pink}>
                    <ellipse cx="32" cy="36" rx="18" ry="16" fill="#ff78c4" stroke="#c84a92" strokeWidth="1.4" />
                    <path d="M20 22 L14 14 L24 18 Z" fill="#ff78c4" stroke="#c84a92" strokeWidth="1.2" />
                    <path d="M44 22 L50 14 L40 18 Z" fill="#ff78c4" stroke="#c84a92" strokeWidth="1.2" />
                    <circle cx="25" cy="34" r="2.4" fill="#fff" />
                    <circle cx="39" cy="34" r="2.4" fill="#fff" />
                    <circle cx="26" cy="35" r="1.2" fill="#1d1d1d" />
                    <circle cx="40" cy="35" r="1.2" fill="#1d1d1d" />
                    <path d="M28 44 Q32 48 36 44" stroke="#c84a92" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </Base>
            )
        case 'a-mummy':
            return (
                <Base bg={BG.gray}>
                    <ellipse cx="32" cy="36" rx="17" ry="16" fill="#f4f4f4" stroke="#8a8a8a" strokeWidth="1.2" />
                    <path d="M16 26 Q32 22 48 26" stroke="#8a8a8a" strokeWidth="1.2" fill="none" />
                    <path d="M15 34 Q32 30 49 34" stroke="#8a8a8a" strokeWidth="1.2" fill="none" />
                    <path d="M16 42 Q32 38 48 42" stroke="#8a8a8a" strokeWidth="1.2" fill="none" />
                    <circle cx="26" cy="34" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="34" r="1.8" fill="#1d1d1d" />
                </Base>
            )
        case 'a-board':
            return (
                <Base bg={BG.orange}>
                    <rect x="10" y="18" width="44" height="30" rx="3" fill="#f5e6c8" stroke="#8b5a2b" strokeWidth="1.4" />
                    <rect x="12" y="20" width="10" height="10" fill="#1d1d1d" />
                    <rect x="24" y="20" width="10" height="10" fill="#8b5a2b" />
                    <rect x="12" y="32" width="10" height="10" fill="#8b5a2b" />
                    <rect x="24" y="32" width="10" height="10" fill="#1d1d1d" />
                </Base>
            )
        case 'a-lama':
            return (
                <Base bg={BG.yellow}>
                    <ellipse cx="32" cy="42" rx="14" ry="10" fill="#f4d6a3" stroke="#8b5a2b" strokeWidth="1.2" />
                    <ellipse cx="32" cy="28" rx="8" ry="12" fill="#f4d6a3" stroke="#8b5a2b" strokeWidth="1.2" />
                    <path d="M20 20 L22 12 L28 16 Z" fill="#f4d6a3" stroke="#8b5a2b" strokeWidth="1" />
                    <path d="M44 20 L42 12 L36 16 Z" fill="#f4d6a3" stroke="#8b5a2b" strokeWidth="1" />
                    <circle cx="28" cy="26" r="1.4" fill="#1d1d1d" />
                    <circle cx="36" cy="26" r="1.4" fill="#1d1d1d" />
                </Base>
            )
        case 'a-ghost':
            return (
                <Base bg={BG.dark}>
                    <path d="M18 42 Q18 16 32 16 Q46 16 46 42 L44 50 L40 44 L36 50 L32 44 L28 50 L24 44 L20 50 Z"
                          fill="#f4f4f4" stroke="#8a8a8a" strokeWidth="1.4" />
                    <circle cx="26" cy="32" r="2" fill="#1d1d1d" />
                    <circle cx="38" cy="32" r="2" fill="#1d1d1d" />
                    <path d="M28 42 Q32 46 36 42" stroke="#1d1d1d" strokeWidth="1.2" fill="none" />
                </Base>
            )
        case 'a-squirrel':
            return (
                <Base bg={BG.orange}>
                    <path d="M44 22 Q56 24 56 36 Q50 30 44 32 Z" fill="#c06a2b" stroke="#5a3818" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#d98c45" stroke="#5a3818" strokeWidth="1.4" />
                    <circle cx="26" cy="36" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="36" r="1.8" fill="#1d1d1d" />
                    <ellipse cx="32" cy="44" rx="4" ry="3" fill="#f4d6a3" />
                    <ellipse cx="32" cy="44" rx="1.4" ry="1" fill="#1d1d1d" />
                </Base>
            )
        case 'a-donkey':
            return (
                <Base bg={BG.gray}>
                    <ellipse cx="32" cy="38" rx="16" ry="14" fill="#b8bcc4" stroke="#4d5662" strokeWidth="1.4" />
                    <path d="M18 22 L22 12 L28 22 Z" fill="#b8bcc4" stroke="#4d5662" strokeWidth="1.2" />
                    <path d="M46 22 L42 12 L36 22 Z" fill="#b8bcc4" stroke="#4d5662" strokeWidth="1.2" />
                    <circle cx="26" cy="36" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="36" r="1.8" fill="#1d1d1d" />
                    <ellipse cx="32" cy="46" rx="4" ry="2.6" fill="#4d5662" />
                </Base>
            )
        case 'a-dog':
            return (
                <Base bg={BG.orange}>
                    <ellipse cx="18" cy="28" rx="6" ry="10" fill="#6b431f" stroke="#5a3818" strokeWidth="1.2" />
                    <ellipse cx="46" cy="28" rx="6" ry="10" fill="#6b431f" stroke="#5a3818" strokeWidth="1.2" />
                    <ellipse cx="32" cy="38" rx="16" ry="14" fill="#c79b6e" stroke="#5a3818" strokeWidth="1.4" />
                    <circle cx="26" cy="36" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="36" r="1.8" fill="#1d1d1d" />
                    <ellipse cx="32" cy="44" rx="4" ry="3" fill="#2b1a08" />
                </Base>
            )
        case 'a-raccoon':
            return (
                <Base bg={BG.dark}>
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#6b778c" stroke="#38414a" strokeWidth="1.4" />
                    <rect x="14" y="30" width="36" height="8" rx="4" fill="#1d1d1d" />
                    <circle cx="25" cy="34" r="1.8" fill="#fff" />
                    <circle cx="39" cy="34" r="1.8" fill="#fff" />
                    <ellipse cx="32" cy="46" rx="4" ry="3" fill="#f4f4f4" />
                </Base>
            )
        case 'a-cupcake':
            return (
                <Base bg={BG.pink}>
                    <path d="M20 36 L44 36 L42 52 L22 52 Z" fill="#d96bb1" stroke="#7a1a52" strokeWidth="1.4" />
                    <path d="M18 36 Q32 20 46 36 Z" fill="#ffe066" stroke="#c79e00" strokeWidth="1.4" />
                    <circle cx="32" cy="24" r="3" fill="#ff5630" />
                    <path d="M22 42 L42 42" stroke="#7a1a52" strokeWidth="1" />
                    <path d="M22 46 L42 46" stroke="#7a1a52" strokeWidth="1" />
                </Base>
            )
        case 'a-piggy':
            return (
                <Base bg={BG.pink}>
                    <circle cx="18" cy="22" r="6" fill="#ff78c4" stroke="#c84a92" strokeWidth="1" />
                    <circle cx="46" cy="22" r="6" fill="#ff78c4" stroke="#c84a92" strokeWidth="1" />
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#ff9ecb" stroke="#c84a92" strokeWidth="1.4" />
                    <ellipse cx="32" cy="42" rx="7" ry="5.5" fill="#ff78c4" stroke="#c84a92" strokeWidth="1.2" />
                    <circle cx="30" cy="42" r="1.2" fill="#c84a92" />
                    <circle cx="34" cy="42" r="1.2" fill="#c84a92" />
                    <circle cx="26" cy="32" r="1.6" fill="#1d1d1d" />
                    <circle cx="38" cy="32" r="1.6" fill="#1d1d1d" />
                </Base>
            )
        case 'a-penguin':
            return (
                <Base bg={BG.blue}>
                    <ellipse cx="32" cy="38" rx="16" ry="18" fill="#1d1d1d" />
                    <ellipse cx="32" cy="42" rx="11" ry="12" fill="#fff" />
                    <circle cx="26" cy="34" r="1.6" fill="#1d1d1d" />
                    <circle cx="38" cy="34" r="1.6" fill="#1d1d1d" />
                    <path d="M28 40 L32 44 L36 40 Z" fill="#ffa726" />
                </Base>
            )
        case 'a-astronaut':
            return (
                <Base bg={BG.dark}>
                    <ellipse cx="32" cy="38" rx="17" ry="15" fill="#f4f4f4" stroke="#8a8a8a" strokeWidth="1.4" />
                    <path d="M15 36 Q32 30 49 36 L49 42 Q32 46 15 42 Z" fill="#4c9aff" stroke="#0052cc" strokeWidth="1.2" />
                    <circle cx="25" cy="38" r="1.6" fill="#fff" />
                    <circle cx="39" cy="38" r="1.6" fill="#fff" />
                </Base>
            )
        case 'a-burger':
            return (
                <Base bg={BG.yellow}>
                    <path d="M14 26 Q32 12 50 26 Z" fill="#f5b642" stroke="#8a6400" strokeWidth="1.4" />
                    <rect x="14" y="26" width="36" height="4" fill="#5a9f3a" />
                    <rect x="14" y="30" width="36" height="4" fill="#c9484a" />
                    <rect x="14" y="34" width="36" height="3" fill="#ffe066" />
                    <path d="M14 38 Q32 48 50 38 Z" fill="#f5b642" stroke="#8a6400" strokeWidth="1.4" />
                </Base>
            )
        case 'a-bee':
            return (
                <Base bg={BG.yellow}>
                    <ellipse cx="32" cy="38" rx="14" ry="11" fill="#ffd600" stroke="#8a6400" strokeWidth="1.4" />
                    <path d="M24 28 L24 48" stroke="#1d1d1d" strokeWidth="2.4" />
                    <path d="M32 27 L32 49" stroke="#1d1d1d" strokeWidth="2.4" />
                    <path d="M40 28 L40 48" stroke="#1d1d1d" strokeWidth="2.4" />
                    <ellipse cx="22" cy="24" rx="7" ry="5" fill="#e0f4ff" opacity="0.8" stroke="#7eb6ff" strokeWidth="1.2" />
                    <ellipse cx="42" cy="24" rx="7" ry="5" fill="#e0f4ff" opacity="0.8" stroke="#7eb6ff" strokeWidth="1.2" />
                    <circle cx="32" cy="22" r="5" fill="#1d1d1d" />
                    <circle cx="30" cy="21" r="1" fill="#fff" />
                    <circle cx="34" cy="21" r="1" fill="#fff" />
                </Base>
            )
        case 'a-zombie':
            return (
                <Base bg={BG.green}>
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#9ee493" stroke="#3a7a2a" strokeWidth="1.4" />
                    <circle cx="25" cy="34" r="2" fill="#1d1d1d" />
                    <circle cx="39" cy="34" r="2" fill="#1d1d1d" />
                    <path d="M24 44 L40 44" stroke="#1d1d1d" strokeWidth="1.4" />
                    <path d="M28 44 L28 46 M32 44 L32 46 M36 44 L36 46" stroke="#1d1d1d" strokeWidth="1.2" />
                </Base>
            )
        case 'a-alien':
            return (
                <Base bg={BG.green}>
                    <ellipse cx="32" cy="36" rx="17" ry="18" fill="#9ee493" stroke="#3a7a2a" strokeWidth="1.4" />
                    <ellipse cx="24" cy="34" rx="4" ry="5.5" fill="#1d1d1d" />
                    <ellipse cx="40" cy="34" rx="4" ry="5.5" fill="#1d1d1d" />
                    <circle cx="25" cy="32" r="1" fill="#fff" />
                    <circle cx="41" cy="32" r="1" fill="#fff" />
                    <path d="M28 46 Q32 49 36 46" stroke="#1d1d1d" strokeWidth="1.2" fill="none" />
                </Base>
            )
        case 'a-pirate2':
            return (
                <Base bg={BG.red}>
                    <path d="M10 26 Q32 10 54 26" fill="none" stroke="#1d1d1d" strokeWidth="3" />
                    <ellipse cx="32" cy="26" rx="22" ry="3" fill="#1d1d1d" />
                    <ellipse cx="32" cy="40" rx="15" ry="14" fill="#f6d3a3" stroke="#a0714a" strokeWidth="1.4" />
                    <circle cx="26" cy="40" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="40" r="1.8" fill="#1d1d1d" />
                    <path d="M28 46 Q32 48 36 46" stroke="#1d1d1d" strokeWidth="1.2" fill="none" />
                </Base>
            )
        case 'a-hook':
            return (
                <Base bg={BG.dark}>
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#b8bcc4" stroke="#4d5662" strokeWidth="1.4" />
                    <path d="M42 42 Q48 42 48 36 Q48 30 42 32" stroke="#c7ccd4" strokeWidth="2.4" fill="none" />
                    <circle cx="25" cy="34" r="1.8" fill="#1d1d1d" />
                    <circle cx="36" cy="34" r="1.8" fill="#1d1d1d" />
                    <path d="M28 44 L32 46 L36 44" stroke="#4d5662" strokeWidth="1.4" fill="none" />
                </Base>
            )
        case 'a-clown':
            return (
                <Base bg={BG.pink}>
                    <ellipse cx="32" cy="36" rx="17" ry="15" fill="#f4f4f4" stroke="#8a8a8a" strokeWidth="1.4" />
                    <circle cx="16" cy="30" r="6" fill="#ff5630" />
                    <circle cx="48" cy="30" r="6" fill="#ff5630" />
                    <circle cx="26" cy="34" r="1.8" fill="#1d1d1d" />
                    <circle cx="38" cy="34" r="1.8" fill="#1d1d1d" />
                    <ellipse cx="32" cy="44" rx="5" ry="4" fill="#ff5630" stroke="#b71c1c" strokeWidth="1" />
                    <path d="M24 44 Q32 50 40 44" stroke="#1d1d1d" strokeWidth="1.4" fill="none" />
                </Base>
            )
        default:
            return null
    }
}