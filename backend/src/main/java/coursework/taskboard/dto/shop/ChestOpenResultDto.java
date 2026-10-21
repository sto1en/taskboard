package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChestOpenResultDto {

    private String chestCode;

    /** item — предмет, leaves — листья. */
    private String rewardType;

    /** common / uncommon / rare / very_rare; null для листьев. */
    private String rarity;

    private String title;
    private String description;

    private Long itemId;
    private String imageUrl;
    private String emoji;
    private String cssClass;

    /** Цена предмета для витрины; null для листьев. */
    private Integer price;

    /** Сколько листьев выпало; null для предмета. */
    private Integer leaves;

    /** Текущее количество ключей. */
    private Integer keys;

    /** Текущий баланс листьев. */
    private Integer leavesBalance;
}
