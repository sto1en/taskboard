package coursework.taskboard.model.reward;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Полученный подарок недели. Уникальная пара (user, week_start) — это
 * идемпотентность claim: повторный запрос читает строку, а не выдаёт
 * предмет ещё раз.
 */
@Entity
@Table(name = "user_weekly_rewards",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_weekly_rewards_week",
                columnNames = {"user_id", "week_start"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWeeklyReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType;

    @Column(name = "item_code", nullable = false, length = 64)
    private String itemCode;

    @Column(name = "claimed_at", nullable = false)
    private LocalDateTime claimedAt;
}
