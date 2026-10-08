package coursework.taskboard.dto.calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
    private String statusAccentCode;
    private Boolean isOverdue;

    // Повторения
    private Boolean isRecurrenceInstance;
    private Long recurrenceParentId;
    private LocalDate occurrenceDate;
}