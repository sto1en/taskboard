package coursework.taskboard.dto.project;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {

    private Long id;
    private Long boardId;
    private String title;
    private String description;
    private Boolean isMain;
    private Integer position;

    private String accentCode;
    private String coverUrl;

    private Long statusId;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;

    private Boolean isPinned;
    private Boolean isTemplate;

    private long taskTotal;
    private long taskDone;
    private long taskActive;
}