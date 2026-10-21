package coursework.taskboard.model.reward;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Расписание бесплатного скина недели.
 *
 * Одна строка — одна календарная неделя (week_start всегда понедельник).
 * Админ заполняет расписание на будущее; пользователи видят подарок
 * текущей недели в магазине.
 */
@Entity
@Table(name = "weekly_reward_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_weekly_reward_week",
                columnNames = {"week_start"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyRewardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    /** TREE | FRAME | AVATAR | ACCENT */
    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType;

    @Column(name = "item_code", nullable = false, length = 64)
    private String itemCode;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.enabled == null) this.enabled = true;
    }
}
