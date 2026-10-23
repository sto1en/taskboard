import { makeAutoObservable } from 'mobx'

/**
 * MobX-стор локальной UI-логики.
 *
 * Зона ответственности MobX в TaskBoard — эфемерное состояние интерфейса:
 * то, что не является серверным фактом, меняется синхронно из хоткеев и
 * обработчиков событий и должно быть видно нескольким неродственным
 * компонентам. Раньше такие значения раскидывались через
 * window.dispatchEvent / CustomEvent — теперь это observable-поля.
 *
 * Шаг D5 перевёл сюда четыре вещи:
 *   - sidebarCollapsed        — вместо localStorage + useState в Sidebar
 *   - treeEnabledLocal        — вместо useState в Sidebar и события 'tree:toggle'
 *   - activeToolbar           — вместо события 'toolbar:close'
 *   - pendingCreate           — вместо события 'hotkey:new'
 *
 * Важно: стор не хранит ответы API. Серверный стейт живёт в Redux
 * (authSlice, shopSlice, sidebarSlice, tasksSlice, statsSlice).
 */

const SIDEBAR_KEY = 'sidebar_collapsed'
const TREE_KEY = 'tree_enabled'

/** Безопасное чтение localStorage: SSR/приватный режим не должны ронять стор. */
function readLocal(key) {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

/** Безопасная запись localStorage (например, quota exceeded). */
function writeLocal(key, value) {
    try {
        localStorage.setItem(key, value)
    } catch {}
}

export class UiStore {
    /**
     * Свёрнута ли боковая панель.
     * Начальное значение — из localStorage('sidebar_collapsed').
     */
    sidebarCollapsed = readLocal(SIDEBAR_KEY) === 'true'

    /**
     * Локальная видимость дерева роста (клавиша T).
     * Дефолт true, если ключа нет. Итоговая видимость считается на месте:
     * user.appearance.treeEnabled !== false && treeEnabledLocal.
     */
    treeEnabledLocal = (() => {
        const v = readLocal(TREE_KEY)
        return v === null ? true : v === 'true'
    })()

    /**
     * id открытого тулбар-поповера (ViewSwitcher / SortSwitcher / FiltersBar).
     * null — все закрыты. Инвариант: открыт максимум один поповер.
     */
    activeToolbar = null

    /**
     * Одноразовый запрос на создание сущности по клавише N.
     * kind: 'board' | 'project' | 'task' | 'calendar-day' | null.
     * Активный экран забирает его через consumeCreate() и открывает модалку.
     */
    pendingCreate = null

    /**
     * Открыт ли выдвижной сайдбар на телефоне (MobileDrawer, кнопка ☰).
     * На десктопе значение не используется: там меню — это Sidebar.
     * Держим в сторе, а не в local state, потому что закрывать его должны
     * и таб-бар, и переход по ссылке, и Escape в AppLayout.
     *
     * Раньше этот флаг был общим для сайдбара и для нижнего листа «ещё»,
     * из-за чего тап по ☰ открывал не только панель, но и всплывающий
     * снизу лист, перекрывавший её. Теперь это два независимых слоя.
     */
    mobileMenuOpen = false

    /**
     * Открыт ли нижний лист «ещё» (MobileTopBar). Живёт только внутри
     * шапки и намеренно не открывается сайдбаром.
     */
    mobileSheetOpen = false

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true })
    }

    // ---------------------------------------------------------------
    // Боковая панель
    // ---------------------------------------------------------------

    toggleCollapsed() {
        this.sidebarCollapsed = !this.sidebarCollapsed
        writeLocal(SIDEBAR_KEY, String(this.sidebarCollapsed))
    }

    setCollapsed(value) {
        this.sidebarCollapsed = !!value
        writeLocal(SIDEBAR_KEY, String(this.sidebarCollapsed))
    }

    // ---------------------------------------------------------------
    // Дерево роста
    // ---------------------------------------------------------------

    toggleTree() {
        this.treeEnabledLocal = !this.treeEnabledLocal
        writeLocal(TREE_KEY, String(this.treeEnabledLocal))
    }

    setTreeEnabled(value) {
        this.treeEnabledLocal = !!value
        writeLocal(TREE_KEY, String(this.treeEnabledLocal))
    }

    // ---------------------------------------------------------------
    // Тулбар-поповеры
    // ---------------------------------------------------------------

    /** Открыть панель panelId; все остальные считают себя закрытыми. */
    openToolbar(panelId) {
        this.activeToolbar = panelId
    }

    /** Закрыть панель panelId (no-op, если она уже закрыта). */
    closeToolbar(panelId) {
        if (this.activeToolbar === panelId) this.activeToolbar = null
    }

    /** Открыта ли конкретная панель. */
    isToolbarOpen(panelId) {
        return this.activeToolbar === panelId
    }

    /** Закрыть все панели (Escape в AppLayout). */
    closeAllToolbars() {
        this.activeToolbar = null
    }

    // ---------------------------------------------------------------
    // Мобильное меню (MobileTopBar)
    // ---------------------------------------------------------------

    openMobileMenu() {
        // Сайдбар и лист «ещё» — взаимоисключающие слои: одновременно они
        // перекрывали бы друг друга.
        this.mobileSheetOpen = false
        this.mobileMenuOpen = true
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false
    }

    toggleMobileMenu() {
        if (this.mobileMenuOpen) this.closeMobileMenu()
        else this.openMobileMenu()
    }

    /** Нижний лист «ещё» в мобильной шапке. */
    openMobileSheet() {
        this.mobileMenuOpen = false
        this.mobileSheetOpen = true
    }

    closeMobileSheet() {
        this.mobileSheetOpen = false
    }

    // ---------------------------------------------------------------
    // Запрос на создание (клавиша N)
    // ---------------------------------------------------------------

    /** Положить запрос на создание сущности kind. */
    requestCreate(kind) {
        this.pendingCreate = kind ?? null
    }

    /**
     * Забрать текущий запрос (одноразовый сигнал) и сбросить его.
     * Возвращает kind или null.
     */
    consumeCreate() {
        const kind = this.pendingCreate
        this.pendingCreate = null
        return kind
    }
}

export default UiStore
