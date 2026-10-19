// frontend/src/components/shop/LeafIcon.jsx

/**
 * Маленький лист для ценника магазина.
 *
 * Раньше цена рисовалась эмодзи 🍃 — его нельзя перекрасить в акцентный цвет
 * выбранного скина. SVG наследует currentColor, поэтому цена, иконка и бейдж
 * редкости всегда совпадают по цвету.
 */

export default function LeafIcon({ size = 13 }) {
    return (
        <svg
            className="shop-leaf-icon"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M20.5 3.5C13.4 3.1 8.1 5.8 5.7 9.9c-1.9 3.2-.9 6.8 1.7 8.4 2.6 1.6 6.2 1 8.2-1.9 2.4-3.5 2.5-8.1 4.9-12.9Z"
                fill="currentColor"
            />
            <path
                d="M4 21c2.1-4.9 5.4-8.5 10.1-11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity=".55"
            />
        </svg>
    )
}
