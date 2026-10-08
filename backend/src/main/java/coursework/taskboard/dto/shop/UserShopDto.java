package coursework.taskboard.dto.shop;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserShopDto {

    private Integer leaves;

    private List<ShopItemDto> avatars;
    private List<ShopItemDto> frames;
    private List<ShopItemDto> treeSkins;
    private List<ShopItemDto> accents;
}