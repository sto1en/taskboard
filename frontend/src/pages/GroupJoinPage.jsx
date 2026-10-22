import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { groupApi } from '../api/api'

/**
 * Присоединение по ссылке-приглашению /join/:token.
 * Показываем только название проекта и кнопку — никаких данных доски.
 */
export default function GroupJoinPage() {
    const { token } = useParams()
    const nav = useNavigate()

    const [invite, setInvite] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let alive = true
        groupApi.previewInvite(token)
            .then(({ data }) => { if (alive) setInvite(data) })
            .catch(err => {
                if (alive) setError(err.response?.data?.message || 'Приглашение не найдено')
            })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [token])

    const join = async () => {
        if (joining) return
        setJoining(true)
        setError(null)
        try {
            const { data } = await groupApi.join(token)
            nav(`/group/${data.project.id}`, { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось присоединиться')
            setJoining(false)
        }
    }

    if (loading) return <div className="loading">Загрузка…</div>

    return (
        <div className="group-join">
            <div className="group-join__card">
                <span className="group-join__icon" aria-hidden="true">👥</span>

                {error ? (
                    <>
                        <h1 className="group-join__title">Приглашение недействительно</h1>
                        <p className="group-join__text">{error}</p>
                        <Link className="btn btn-ghost" to="/group">К групповым проектам</Link>
                    </>
                ) : (
                    <>
                        <h1 className="group-join__title">
                            Приглашение в «{invite.projectTitle}»
                        </h1>
                        <p className="group-join__text">
                            Вы получите доступ к задачам этого проекта. Доска и другие
                            проекты останутся недоступны.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={join}
                            disabled={joining}
                        >
                            {joining ? 'Присоединяемся…' : 'Присоединиться'}
                        </button>
                        <Link className="group-join__later" to="/group">
                            Позже
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
