package coursework.taskboard.dto.leaderboard;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardDto {

    private List<LeaderboardCategoryDto> categories;
    private long totalUsers;
}
