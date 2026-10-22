package coursework.taskboard.dto.template;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPlanResultDto {
    private Long projectId;
    private String projectTitle;
    private int createdTasks;
    private int createdSubtasks;
    private String message;
}
