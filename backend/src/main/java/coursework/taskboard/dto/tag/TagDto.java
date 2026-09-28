package coursework.taskboard.dto.tag;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagDto {

    private Long id;
    private Long boardId;
    private String code;
    private String title;
    private Integer position;
    private Boolean isSystem;

    private String accentCode;
    private String icon;
    private Boolean isBold;

    private long taskCount;
}