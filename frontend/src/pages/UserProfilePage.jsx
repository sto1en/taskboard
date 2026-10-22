import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileWall from '../components/profile/ProfileWall'

export default function UserProfilePage() {
    const { id } = useParams()
    const { user } = useAuth()
    const userId = Number(id)
    const own = user?.id != null && Number(user.id) === userId

    if (!Number.isFinite(userId)) {
        return <div className="wall-error">Пользователь не найден</div>
    }

    return (
        <div className="profile-page profile-page--wall">
            <div className="profile-wall__topbar">
                <Link to="/" className="btn btn-ghost">← На главную</Link>
            </div>
            <ProfileWall userId={userId} own={own} />
        </div>
    )
}
