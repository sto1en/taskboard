package coursework.taskboard.dto.task;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecurrenceOverrideRequestDto {

    /** 'skip' | 'complete' | 'override' */
    private String mode;

    private String overrideTitle;
    private LocalDateTime overrideDeadline;
    private Long overrideStatusId;
}