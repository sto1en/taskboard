import { Link } from 'react-router-dom'

export default function HelpPage() {
    return (
        <div className="info-page">
            <h1 className="info-page__title">Help</h1>

            <section className="info-page__section">
                <h2>Быстрый старт</h2>
                <ol>
                    <li>Создайте доску — это направление работы (например, «Фотография»)</li>
                    <li>Внутри доски автоматически появится главный проект <b>main</b></li>
                    <li>Создавайте задачи прямо в этом проекте — так работает простой режим</li>
                    <li>Когда понадобится структура — создайте новые проекты и этапы</li>
                </ol>
            </section>

            <section className="info-page__section">
                <h2>Основные понятия</h2>
                <dl className="info-page__defs">
                    <dt>Доска</dt>
                    <dd>Направление работы. Содержит проекты.</dd>

                    <dt>Проект</dt>
                    <dd>Конкретная работа внутри направления. Содержит задачи и (опционально) этапы.</dd>

                    <dt>Этап</dt>
                    <dd>Фаза проекта (Подготовка, Съёмка, Обработка). Не обязателен.</dd>

                    <dt>Задача</dt>
                    <dd>Конкретное действие. Может иметь подзадачи, теги, дедлайн и вложения.</dd>

                    <dt>Статус</dt>
                    <dd>Состояние задачи (Backlog, В работе, Готово). Настраивается для каждой доски.</dd>

                    <dt>Тег</dt>
                    <dd>Метка для фильтрации задач внутри доски.</dd>
                </dl>
            </section>

            <section className="info-page__section">
                <h2>Виды отображения</h2>
                <ul>
                    <li><b>Kanban</b> — колонки по статусам</li>
                    <li><b>Список</b> — плоский список задач (как документ)</li>
                    <li><b>Компакт</b> — группы по статусам со сворачиванием</li>
                </ul>
                <p>Вид переключается в шапке проекта кнопкой <b>▦ / ☰ / ⊞</b>.</p>
            </section>

            <section className="info-page__section">
                <h2>Горячие клавиши</h2>
                <ul>
                    <li><kbd>Esc</kbd> — закрыть модальное окно</li>
                    <li><kbd>Enter</kbd> — сохранить переименование</li>
                </ul>
            </section>

            <section className="info-page__section">
                <h2>Связь</h2>
                <p>
                    По вопросам — пишите на <a href="mailto:support@taskboard.local">support@taskboard.local</a>
                </p>
            </section>

            <p className="info-page__back">
                <Link to="/boards">← Вернуться к доскам</Link>
            </p>
        </div>
    )
}