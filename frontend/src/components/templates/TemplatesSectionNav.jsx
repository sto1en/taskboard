import { useEffect, useState } from 'react'

/**
 * Навигация раздела «Шаблоны»:
 *
 *   🧩 Мои шаблоны   🌍 Публичные шаблоны
 *                         ├ Мои публичные
 *                         └ Публичные шаблоны пользователей
 *
 * Гайды переименованы в публичный шаблон, поэтому отдельной вкладки
 * «Гайды» здесь больше нет — публичные шаблоны и есть та библиотека.
 */
export default function TemplatesSectionNav({
    tab = 'mine',
    scope = 'all',
    myPublicCount = 0,
    onTabChange,
    onScopeChange,
}) {
    const publicActive = tab === 'public'
    const [subOpen, setSubOpen] = useState(publicActive)

    // Переход на публичные из другого места раскрывает подкнопки.
    useEffect(() => {
        if (publicActive) setSubOpen(true)
    }, [publicActive])

    return (
        <div className="templates-nav">
            <nav className="section-subnav" aria-label="Шаблоны">
                <button
                    type="button"
                    className={`section-subnav__item ${tab === 'mine' ? 'section-subnav__item--active' : ''}`}
                    onClick={() => onTabChange?.('mine')}
                >
                    🧩 Мои шаблоны
                </button>
                <button
                    type="button"
                    className={`section-subnav__item ${publicActive ? 'section-subnav__item--active' : ''}`}
                    onClick={() => {
                        setSubOpen(true)
                        onTabChange?.('public')
                    }}
                    aria-expanded={subOpen}
                >
                    🌍 Публичные шаблоны
                    {myPublicCount > 0 && (
                        <span className="section-subnav__count">{myPublicCount}</span>
                    )}
                </button>
            </nav>

            {publicActive && subOpen && (
                <div className="templates-nav__sub" role="tablist" aria-label="Публичные шаблоны">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={scope === 'mine'}
                        className={`templates-nav__sub-btn ${scope === 'mine' ? 'is-active' : ''}`}
                        onClick={() => onScopeChange?.('mine')}
                    >
                        ⭐ Мои публичные шаблоны
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={scope !== 'mine'}
                        className={`templates-nav__sub-btn ${scope !== 'mine' ? 'is-active' : ''}`}
                        onClick={() => onScopeChange?.('all')}
                    >
                        👥 Публичные шаблоны пользователей
                    </button>
                </div>
            )}
        </div>
    )
}
