import { useCallback, useRef, useState } from 'react'
import { userApi } from '../api/api'

/**
 * Хук для кастомного подтверждения удаления.
 *
 * props:
 *   confirmBeforeDelete — boolean из user.workspace.confirmBeforeDelete
 *   updateUser — функция из AuthContext, чтобы обновить локально user.workspace
 *
 * Возвращает:
 *   requestDelete({ kind, title, onConfirm })
 *     — открывает ConfirmModal. Если confirmBeforeDelete = false,
 *       вызывает onConfirm сразу без модалки.
 *
 *   ConfirmModalProps — готовые пропсы для <ConfirmModal {...ConfirmModalProps} />
 */
export default function useConfirmDelete({ confirmBeforeDelete, updateUser }) {
    const [pending, setPending] = useState(null)   // { kind, title, onConfirm }
    const [loading, setLoading] = useState(false)

    // ref, чтобы иметь актуальное значение — confirmBeforeDelete может меняться
    const confirmRef = useRef(confirmBeforeDelete)
    confirmRef.current = confirmBeforeDelete

    const requestDelete = useCallback(({ kind, title, onConfirm }) => {
        if (!confirmRef.current) {
            // Пользователь отключил подтверждение — удаляем сразу
            onConfirm && onConfirm()
            return
        }
        setPending({ kind, title, onConfirm })
    }, [])

    const handleConfirm = async ({ dontAsk }) => {
        if (!pending) return
        setLoading(true)
        try {
            if (dontAsk && updateUser) {
                try {
                    const { data } = await userApi.updateWorkspace({
                        confirmBeforeDelete: false,
                    })
                    updateUser({ workspace: data })
                } catch (e) {
                    console.error('Failed to update workspace settings', e)
                }
            }
            await pending.onConfirm()
            setPending(null)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) setPending(null)
    }

    const kindLabel = pending?.kind === 'board'   ? 'доску'
        : pending?.kind === 'project' ? 'проект'
            : pending?.kind === 'task'    ? 'задачу'
                : 'запись'

    const modalProps = {
        open: !!pending,
        title: `Удалить ${kindLabel}?`,
        text: pending
            ? `Удалить «${pending.title}»? Это действие нельзя отменить.`
            : '',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        danger: true,
        loading,
        showDontAsk: true,
        dontAskLabel: 'Больше не спрашивать',
        onConfirm: handleConfirm,
        onClose: handleClose,
    }

    return { requestDelete, modalProps }
}