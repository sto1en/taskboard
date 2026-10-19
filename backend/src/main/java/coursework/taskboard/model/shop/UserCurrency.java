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
}