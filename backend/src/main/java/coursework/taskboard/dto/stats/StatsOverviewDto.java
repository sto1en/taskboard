package coursework.taskboard.dto.stats;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsOverviewDto {

    private String period;

    // Базовые цифры (как было)
    private long total;
    private long done;
    private long active;
    private long overdue;
    private long archived;
    private long cancelled;

    // Диаграммы
    private List<DailyStatDto> daily;
    private List<StatusSliceDto> byStatus;
    private List<TopTagDto> topTags;
    private List<DailyLoadDto> dailyLoad;
}