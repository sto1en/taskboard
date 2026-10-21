package coursework.taskboard.model.inventory;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * Расходуемый предмет инвентаря пользователя (например, ключ от сундука).
 *
 * Ключи — не валюта: они не участвуют в балансе листьев, а лежат отдельной
 * строкой с item_code = 'forest_key' и списываются при открытии сундука.
 */
@Entity
@Table(name = "user_inventory",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_inventory_item",
                columnNames = {"user_id", "item_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "item_code", nullable = false, length = 64)
    private String itemCode;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;
}
