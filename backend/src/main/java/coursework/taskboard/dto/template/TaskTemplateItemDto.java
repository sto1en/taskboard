package coursework.taskboard.dto.template;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplateItemDto {
    private Long id;
    private Integer position;
    private String title;
    private String description;
    private Short priority;
    private Integer deadlineOffsetDays;
    private String statusCategoryCode;
    private Integer estimatedMinutes;
    private String startTime;
    private List<String> subtasks;
}
