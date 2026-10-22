package coursework.taskboard.dto.shop;

import lombok.*;

/**
 * Фон профиля в публичном ответе (выбор фона на стене).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackgroundDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String imageUrl;
    private String cssClass;
    private Integer price;
    private Integer oldPrice;
}
