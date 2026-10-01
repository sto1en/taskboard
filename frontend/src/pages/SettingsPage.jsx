import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useT from '../hooks/useT'
import ConfirmModal from '../components/common/ConfirmModal'

export default function SettingsPage() {
    const { user, logout } = useAuth()
    const t = useT()
    const [showLogout, setShowLogout] = useState(false)

    const handleLogoutConfirm = () => {
        setShowLogout(false)
        logout()
    }

    return (
        <div className="info-page">
            <h1 className="info-page__title">{t.settingsTitle}</h1>

            <section className="info-page__section">
                <h2>{t.account}</h2>
                <div className="settings-list">
                    <Link to="/profile?tab=profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.profileItem}</div>
                            <div className="settings-item__desc">{t.profileItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile?tab=appearance" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.appearanceItem}</div>
                            <div className="settings-item__desc">{t.appearanceItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile?tab=locale" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.localeItem}</div>
                            <div className="settings-item__desc">{t.localeItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile?tab=workspace" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.workspaceItem}</div>
                            <div className="settings-item__desc">{t.workspaceItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile?tab=display" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.displayItem}</div>
                            <div className="settings-item__desc">{t.displayItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile?tab=notification" className="settings-item">
                        <div>
                            <div className="settings-item__title">{t.notificationItem}</div>
                            <div className="settings-item__desc">{t.notificationItemDesc}</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>
                </div>
            </section>

            <section className="info-page__section">
                <h2>{t.session}</h2>
                <p className="info-page__hint">
                    {t.loggedInAs} <b>{user?.username}</b>
                </p>
                <button
                    className="btn btn-danger settings-logout"
                    onClick={() => setShowLogout(true)}
                >
                    {t.logout}
                </button>
            </section>

            <p className="info-page__back">
                <Link to="/boards">{t.backToBoards}</Link>
            </p>

            <ConfirmModal
                open={showLogout}
                title={t.confirmLogoutTitle}
                text={t.confirmLogoutText}
                confirmLabel={t.yesLogout}
                cancelLabel={t.cancel}
                danger
                onConfirm={handleLogoutConfirm}
                onClose={() => setShowLogout(false)}
            />
        </div>
    )
}