package coursework.taskboard.model.usergroup;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Пользовательская группа — именованный список людей, которого владелец
 * может одним действием пригласить в кооперативный проект.
 *
 * originGroupId заполняется у «зеркальной» группы, которая создаётся
 * человеку после того, как он принял приглашение в чужую группу.
 */
@Entity
@Table(name = "user_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 64)
    private String name;

    @Column(name = "origin_group_id")
    private Long originGroupId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
