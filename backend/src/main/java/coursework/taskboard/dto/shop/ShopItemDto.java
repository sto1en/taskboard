package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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
    private Integer oldPrice;
    private String cssClass;
    private String emoji;
    private String imageUrl;

    // Для акцентов
    private String hexColor;
    private String hexColorSecondary;
    private Boolean isGradient;

    private Boolean owned;
    private Boolean active;
    private LocalDateTime createdAt;

    // Список категорий (для всех типов)
    private List<CategoryDto> categories;
}