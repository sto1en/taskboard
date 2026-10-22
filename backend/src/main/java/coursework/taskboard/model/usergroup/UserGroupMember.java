package coursework.taskboard.model.usergroup;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Участник пользовательской группы.
 *
 * status = pending — приглашение отправлено, но человек ещё не согласился;
 * status = accepted — группа существует и для него, его можно приглашать
 * в проекты одной кнопкой.
 */
@Entity
@Table(name = "user_group_members",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_group_members",
                columnNames = {"group_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGroupMember {

    public static final String PENDING = "pending";
    public static final String ACCEPTED = "accepted";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private UserGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
