package coursework.taskboard.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class RecurrenceRequestDto {

    @NotBlank
    private String rule;          // 'daily', 'weekly:1,3,5', 'monthly:15', ...

    private LocalTime timeOfDay;

    /** Если null — используем deadline задачи. */
    private LocalDateTime startAt;

    private String endMode = "never";   // 'never' | 'until' | 'count'
    private LocalDateTime endUntil;
    private Integer endCount;
}