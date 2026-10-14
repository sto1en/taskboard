package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private String code;
    private String title;
    private Integer sortOrder;
}