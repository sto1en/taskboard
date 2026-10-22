package coursework.taskboard.model.social;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

/** Один слот витрины профиля (до трёх достижений). */
@Entity
@Table(name = "user_profile_showcase",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_profile_showcase_item",
                columnNames = {"user_id", "achievement_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileShowcase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;
}
