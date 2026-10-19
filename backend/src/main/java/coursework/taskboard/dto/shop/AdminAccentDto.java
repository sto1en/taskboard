package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAccentDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String hexColor;
    private String hexColorSecondary;
    private String hexColorTertiary;
    private Boolean isGradient;
    private Boolean isRare;
    private String imageUrl;
    private Integer price;
    private Integer oldPrice;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private List<CategoryDto> categories;
}