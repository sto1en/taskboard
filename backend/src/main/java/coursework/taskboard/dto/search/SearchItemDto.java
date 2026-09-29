package coursework.taskboard.dto.search;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchItemDto {

    private String kind;
    private Long id;
    private String title;
    private String subtitle;
    private String matchReason;
    private String accentCode;
    private String icon;

    private Long boardId;
    private Long projectId;
}