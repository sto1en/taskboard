package coursework.taskboard.dto.stats;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyGoalDto {

    private String date;
    private long done;
    private int target;

    private int goodAt;
    private int excellentAt;
    private int legendaryAt;

    /** none / good / excellent / legendary */
    private String tier;
    /** Следующий статус или null, если легендарный день уже достигнут. */
    private String nextTier;
    private Integer nextTierAt;

    /** Сколько листьев даёт текущий статус (0 для none). */
    private int rewardLeaves;

    private boolean claimed;
    private LocalDateTime claimedAt;
    private boolean canClaim;
}
