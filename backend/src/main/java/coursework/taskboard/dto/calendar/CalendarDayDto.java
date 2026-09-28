package coursework.taskboard.dto.calendar;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDayDto {

    private String date;    // yyyy-MM-dd
    private List<CalendarTaskDto> tasks;
}