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
