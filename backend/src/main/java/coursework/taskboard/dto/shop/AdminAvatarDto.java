package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAvatarDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String emoji;
    private String imageUrl;
    private String cssClass;
    private Integer price;
    private Integer sortOrder;

    private Long categoryId;
    private String categoryCode;
    private String categoryTitle;
}