package coursework.taskboard.dto.achievement;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.achievement.UserAchievement;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AchievementMapper {

    public AchievementDto toDto(Achievement a, UserAchievement unlocked, String rewardItemTitle) {
        return AchievementDto.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .icon(a.getIcon())
                .accentCode(a.getAccentCode())
                .threshold(a.getThreshold())
                .reward(a.getReward())
                .rewardItemType(a.getRewardItemType())
                .rewardItemCode(a.getRewardItemCode())
                .rewardItemTitle(rewardItemTitle)
                .unlocked(unlocked != null)
                .unlockedAt(unlocked != null ? unlocked.getUnlockedAt() : null)
                .build();
    }

    public AchievementDto toDto(Achievement a, UserAchievement unlocked) {
        return toDto(a, unlocked, null);
    }

    public AchievementDto toUnlockedDto(Achievement a, String rewardItemTitle) {
        return toDto(a, UserAchievement.builder()
                .achievement(a)
                .unlockedAt(LocalDateTime.now())
                .build(), rewardItemTitle);
    }

    public AchievementDto toUnlockedDto(Achievement a) {
        return toUnlockedDto(a, null);
    }
}