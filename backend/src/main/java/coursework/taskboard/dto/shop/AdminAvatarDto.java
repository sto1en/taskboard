package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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
    private Integer oldPrice;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private List<CategoryDto> categories;
}