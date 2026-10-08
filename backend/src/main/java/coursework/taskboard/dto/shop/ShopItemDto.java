package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopItemDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private Integer price;
    private String cssClass;
    private String emoji;
    private String imageUrl;
    private Boolean owned;
    private Boolean active;
}