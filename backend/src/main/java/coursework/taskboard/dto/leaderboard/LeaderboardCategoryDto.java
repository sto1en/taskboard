package coursework.taskboard.dto.leaderboard;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardCategoryDto {

    private String code;
    private String title;
    private String description;
    private String icon;
    private String unit;
    private List<LeaderboardEntryDto> entries;
}
