package coursework.taskboard.dto.project;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailDto {

    private Long id;
    private Long boardId;
    private String title;
    private String description;
    private Boolean isMain;
    private Integer position;

    private String accentCode;
    private String coverUrl;
    private String statusCode;
    private String statusTitle;

    private long taskTotal;
    private long taskDone;
    private long taskActive;

    private List<StageSummaryDto> stages;
}