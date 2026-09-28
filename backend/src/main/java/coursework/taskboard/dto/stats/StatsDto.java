package coursework.taskboard.dto.stats;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsDto {

    private String period;       // day / week / month / year
    private long total;
    private long done;
    private long active;
    private long overdue;
    private long archived;
    private long cancelled;
}