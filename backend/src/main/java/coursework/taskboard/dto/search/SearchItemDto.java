package coursework.taskboard.dto.search;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchItemDto {

    private String kind;         // board / project / task / tag
    private Long id;
    private String title;
    private String subtitle;     // контекст (доска, проект)
    private String matchReason;  // 'tag:#свадьба' или null
    private String accentCode;
    private String icon;

    private Long boardId;
    private Long projectId;
}