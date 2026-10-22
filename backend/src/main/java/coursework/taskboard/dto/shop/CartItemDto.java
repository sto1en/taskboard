package coursework.taskboard.dto.shop;

import lombok.*;

/**
 * Одна позиция корзины: тип предмета (avatar | frame | tree | accent)
 * и его id в соответствующей таблице магазина.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {

    private String type;
    private Long id;
}
