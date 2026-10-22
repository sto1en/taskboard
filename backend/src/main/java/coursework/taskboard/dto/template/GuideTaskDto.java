package coursework.taskboard.dto.template;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuideTaskDto {
    private Long id;
    private Integer position;
    private Integer dayOffset;
    private String title;
    private String description;
    private Short priority;
    private String statusCategoryCode;
    private Integer estimatedMinutes;
    private List<String> subtasks;
}
