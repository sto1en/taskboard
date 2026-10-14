package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminFrameDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String cssClass;
    private String imageUrl;
    private String hexColor;
    private Integer price;
    private Integer oldPrice;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private List<CategoryDto> categories;
}