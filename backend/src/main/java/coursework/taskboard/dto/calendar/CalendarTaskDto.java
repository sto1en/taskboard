package coursework.taskboard.dto.calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarTaskDto {

    private Long id;
    private String title;
    private Long projectId;
    private String projectTitle;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;
    private String statusAccentCode;
    private Boolean isOverdue;

    // Вложения (только имена, для скрепки)
    private List<String> attachmentNames;

    // Повторения
    private Boolean isRecurrenceInstance;
    private Long recurrenceParentId;
    private LocalDate occurrenceDate;
}