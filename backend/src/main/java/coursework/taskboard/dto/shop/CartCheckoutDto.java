package coursework.taskboard.dto.shop;

import lombok.*;

import java.util.List;

/**
 * Результат оформления корзины: что куплено, сколько всего ушло листьев
 * и свежее состояние магазина (баланс + флаги owned/active).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartCheckoutDto {

    private UserShopDto shop;

    /** Сколько позиций куплено. */
    private Integer count;

    /** Сколько листьев списано суммарно. */
    private Integer total;

    /** Названия купленных предметов — для экрана «Спасибо за покупку». */
    private List<String> titles;
}
