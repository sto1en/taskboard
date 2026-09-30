package coursework.taskboard.dto.task;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskShortDto {

    private Long id;
    private String title;
    private Long parentId;
    private Long statusId;
    private String statusCode;
    private String statusCategoryCode;
    private String statusTitle;
    private String statusAccentCode;
    private Short priority;
    private LocalDateTime deadline;
    private Integer position;
    private List<String> attachmentNames;
    private long subtaskTotal;
    private long subtaskDone;
    private List<TaskShortDto> subtasks;
    private List<TagShortDto> tags;
}