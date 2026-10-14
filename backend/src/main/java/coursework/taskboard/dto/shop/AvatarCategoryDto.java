package coursework.taskboard.dto.shop;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCategoryDto {
    private Long id;
    private String code;
    private String title;
    private Integer sortOrder;
    private long avatarCount;
}