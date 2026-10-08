package coursework.taskboard.dto.task;

import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurrenceDto {

    private String rule;           // 'daily', 'weekly:1,3,5', ...
    private LocalTime timeOfDay;
    private LocalDateTime startAt;
    private String endMode;        // 'never' | 'until' | 'count'
    private LocalDateTime endUntil;
    private Integer endCount;

    /** Превью — ближайшие N вхождений (только для GET /preview). */
    private List<LocalDateTime> preview;
}