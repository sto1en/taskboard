package coursework.taskboard.model.inventory;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Журнал выдачи ключей за milestone (15, 30, 45... выполненных задач за
 * локальный день пользователя).
 *
 * Уникальность (user_id, grant_date, milestone) — главная защита от
 * повторной выдачи: GET /api/shop/chests вызывает sync, но уже выданные
 * milestone просто пропускаются.
 */
@Entity
@Table(name = "user_key_grants",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_key_grants_day_milestone",
                columnNames = {"user_id", "grant_date", "milestone"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserKeyGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "grant_date", nullable = false)
    private LocalDate grantDate;

    @Column(nullable = false)
    private Integer milestone;

    @Column(name = "granted_at", nullable = false)
    @Builder.Default
    private LocalDateTime grantedAt = LocalDateTime.now();
}
