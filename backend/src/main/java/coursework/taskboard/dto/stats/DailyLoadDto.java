package coursework.taskboard.dto.stats;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLoadDto {

    /** yyyy-MM-dd */
    private String date;

    private long openCount;      // сколько активных задач с этим дедлайном
    private long doneCount;      // сколько закрыто в этот день
    private long overdueCount;   // сколько просрочено с этим дедлайном

    /** empty | low | medium | high */
    private String level;
}