import { useSelector } from 'react-redux'
import { getMessages } from '../i18n/messages'

/**
 * Возвращает словарь переводов для текущего языка интерфейса.
 *
 * ВАЖНО: раньше здесь вызывался useAuth(), а useAuth() на каждом
 * монтировании диспатчил fetchMe() (GET /users/me). Поскольку useT()
 * используется почти в каждом компоненте (включая каждый столбец канбана
 * и каждую карточку задачи), это порождало десятки параллельных
 * /users/me и, вместе с заменой user на новый объект, — лавину
 * перезапросов (ERR_INSUFFICIENT_RESOURCES).
 *
 * Теперь язык читается напрямую из Redux-селектора, без побочных
 * эффектов и без сетевых запросов.
 */
export default function useT() {
    const lang = useSelector((state) => state.auth.user?.locale?.language) || 'ru'
    return getMessages(lang)
}
