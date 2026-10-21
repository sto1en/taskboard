package coursework.taskboard.model.reward;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Забранная награда за день. Уникальная пара (user, reward_date) — это
 * идемпотентность ежедневной награды: повторный claim читает строку,
 * а не начисляет листья ещё раз.
 */
@Entity
@Table(name = "user_daily_rewards",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_daily_rewards_day",
                columnNames = {"user_id", "reward_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reward_date", nullable = false)
    private LocalDate rewardDate;

    @Column(name = "tasks_done", nullable = false)
    private Integer tasksDone;

    @Column(nullable = false, length = 20)
    private String tier;

    @Column(name = "leaves_awarded", nullable = false)
    private Integer leavesAwarded;

    @Column(name = "claimed_at", nullable = false)
    private LocalDateTime claimedAt;
}
