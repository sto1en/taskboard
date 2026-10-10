package coursework.taskboard.dto.task;

import coursework.taskboard.dto.attachment.AttachmentDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {

    private Long id;
    private Long projectId;
    private Long stageId;
    private Long parentId;

    private String title;
    private String description;
    private Integer position;

    private Long statusId;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;
    private String statusAccentCode;

    private Short priority;
    private Boolean isPinned;

    private LocalDateTime deadline;
    private LocalDateTime expiredAt;
    private LocalDateTime completedAt;

    private List<TagShortDto> tags;
    private List<AttachmentDto> attachments;
    private List<TaskShortDto> subtasks;
    private long subtaskTotal;
    private long subtaskDone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ============================================================
    // Авторы / редакторы
    // ============================================================

    private UserShortDto startedBy;
    private UserShortDto lastEditedBy;
    private LocalDateTime lastEditedAt;

    // ============================================================
    // Повторения
    // ============================================================

    private Boolean isRecurrenceInstance;
    private Long recurrenceParentId;
    private java.time.LocalDate occurrenceDate;
    private RecurrenceDto recurrence;
}