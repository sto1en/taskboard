package coursework.taskboard.model.project;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Ссылка-приглашение в групповой проект.
 *
 * Токен одноразовый по смыслу: после присоединения он остаётся в таблице,
 * но повторно войти по нему можно только если пользователь ещё не участник.
 * Срок жизни ограничен (по умолчанию 14 дней).
 */
@Entity
@Table(name = "project_invites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectInvite {

    @Id
    @Column(nullable = false, length = 64)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /**
     * Адресат персонального приглашения (например, из пользовательской группы).
     * NULL — обычная ссылка-приглашение, которую может использовать любой.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_user_id")
    private User invitedUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.expiresAt == null) {
            this.expiresAt = this.createdAt.plusDays(14);
        }
    }
}
