import { useAuth } from '../context/AuthContext'
import { getMessages } from '../i18n/messages'

export default function useT() {
    const { user } = useAuth()
    const lang = user?.locale?.language || 'ru'
    return getMessages(lang)
}