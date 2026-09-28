package coursework.taskboard.dto.calendar;

import lombok.*;

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
}