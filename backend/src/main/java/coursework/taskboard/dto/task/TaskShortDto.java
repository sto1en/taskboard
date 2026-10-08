package coursework.taskboard.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
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
    private Boolean isOverdue;
    private Integer position;
    private List<String> attachmentNames;
    private long subtaskTotal;
    private long subtaskDone;
    private List<TaskShortDto> subtasks;
    private List<TagShortDto> tags;

    // Повторения
    private Boolean isRecurrenceInstance;
    private Long recurrenceParentId;
    private LocalDate occurrenceDate;
}