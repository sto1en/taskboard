package coursework.taskboard.dto.stats;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatDto {

    /** yyyy-MM-dd */
    private String date;

    private long done;
    private long created;
    private long overdue;
}