package coursework.taskboard.dto.board;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummaryDto {

    private Long id;
    private String title;
    private String description;
    private Boolean isMain;
    private Integer position;
    private String accentCode;
    private String statusCode;
    private String statusTitle;

    private long taskTotal;
    private long taskDone;
}