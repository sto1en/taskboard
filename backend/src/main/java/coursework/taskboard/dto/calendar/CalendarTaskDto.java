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
    private Long boardId;
    /** true — доска с другими участниками (кооп), false — без участников (собственная) */
    private Boolean coop;
    private String statusCode;
    private String statusTitle;
    private String statusCategoryCode;
    private String statusAccentCode;
    private Boolean isOverdue;
    /** Приоритет задачи: -1 низкий, 0 обычный, 1/2 высокий. */
    private Short priority;

    // Вложения (только имена, для скрепки)
    private List<String> attachmentNames;

    // Повторения
    private Boolean isRecurrenceInstance;
    private Long recurrenceParentId;
    private LocalDate occurrenceDate;
}