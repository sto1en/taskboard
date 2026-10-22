package coursework.taskboard.dto.leaderboard;

import coursework.taskboard.dto.social.SocialUserDto;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {

    private int rank;
    private SocialUserDto user;
    private long value;
    private boolean me;
}
