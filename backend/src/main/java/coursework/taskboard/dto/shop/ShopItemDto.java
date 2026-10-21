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

    /** Редкий акцент (металл/контур): фронт рисует отдельный стиль. */
    private Boolean isRare;
    private String hexColorTertiary;

    /** Сколько раз предмет покупали (для сортировки «по популярности»). */
    private Long purchaseCount;

    private Boolean owned;
    private Boolean active;

    /**
     * Предмет выдаётся за ачивку, поэтому не продаётся.
     * Фронт показывает «За ачивку» вместо цены и кнопки покупки.
     */
    private Boolean rewardOnly;

    /** Сколько листьев реально ушло на покупку. null — предмет подарен ачивкой. */
    private Integer pricePaid;

    private LocalDateTime createdAt;

    // Список категорий (для всех типов)
    private List<CategoryDto> categories;
}