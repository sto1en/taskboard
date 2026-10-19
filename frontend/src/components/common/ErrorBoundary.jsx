import { Component } from 'react'

/**
 * Ловит ошибки рендера/жизненного цикла ниже по дереву.
 *
 * Без него любая ошибка в одном компоненте (например, в виджете дашборда)
 * размонтировала всё приложение и оставляла пользователя с белым экраном.
 * Теперь показываем понятное сообщение, детали — в консоли, и даём
 * перезагрузить страницу, не теряя остальной UI-каркас.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        console.error('Unhandled render error:', error, info?.componentStack)
    }

    handleReload = () => {
        window.location.reload()
    }

    handleReset = () => {
        this.setState({ error: null })
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children

        return (
            <div className="error-boundary" role="alert">
                <div className="error-boundary__card">
                    <div className="error-boundary__emoji">🌳</div>
                    <h2 className="error-boundary__title">Что-то сломалось</h2>
                    <p className="error-boundary__text">
                        Экран не смог отрисоваться. Данные не потеряны — попробуйте
                        обновить страницу или вернуться назад.
                    </p>
                    <pre className="error-boundary__details">
                        {String(error?.message || error)}
                    </pre>
                    <div className="error-boundary__actions">
                        <button className="btn btn-primary" onClick={this.handleReload}>
                            Обновить страницу
                        </button>
                        <button className="btn btn-secondary" onClick={this.handleReset}>
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}
