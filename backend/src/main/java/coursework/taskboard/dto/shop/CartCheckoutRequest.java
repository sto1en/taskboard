package coursework.taskboard.dto.shop;

import lombok.*;

import java.util.List;

/**
 * Запрос на оформление корзины: все позиции покупаются одной транзакцией,
 * деньги списываются один раз — либо всё, либо ничего.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartCheckoutRequest {

    private List<CartItemDto> items;
}
