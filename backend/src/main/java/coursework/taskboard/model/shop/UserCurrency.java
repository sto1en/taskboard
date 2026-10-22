package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_currency")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCurrency {

    /**
     * user_id — он же PK и (логически) FK на users(id).
     *
     * Раньше здесь стоял @MapsId + @OneToOne, но Hibernate падал с
     * AssertionFailure «null identifier»: id выводился из ассоциации, а она
     * приходила detached (фильтр JWT, свежая регистрация). Обычной колонки
     * достаточно — значение всегда равно id пользователя.
     */
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Integer leaves = 0;

    /** Всего заработано листьев за всё время (для лидерборда). */
    @Column(name = "total_earned", nullable = false)
    @Builder.Default
    private Integer totalEarned = 0;

    /** Всего потрачено листьев за всё время. */
    @Column(name = "total_spent", nullable = false)
    @Builder.Default
    private Integer totalSpent = 0;

    /** Сколько сундуков открыто. */
    @Column(name = "chests_opened", nullable = false)
    @Builder.Default
    private Integer chestsOpened = 0;
}