package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/** Скин дерева в админке. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTreeDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private Integer price;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private List<CategoryDto> categories;
}
