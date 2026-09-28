package coursework.taskboard.dto.calendar;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDto {

    private String from;    // yyyy-MM-dd
    private String to;
    private List<CalendarDayDto> days;
}