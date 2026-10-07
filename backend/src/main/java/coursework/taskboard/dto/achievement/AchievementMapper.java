package coursework.taskboard.dto.achievement;

import coursework.taskboard.model.achievement.Achievement;
import coursework.taskboard.model.achievement.UserAchievement;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AchievementMapper {

    public AchievementDto toDto(Achievement a, UserAchievement unlocked) {
        return AchievementDto.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .icon(a.getIcon())
                .accentCode(a.getAccentCode())
                .threshold(a.getThreshold())
                .unlocked(unlocked != null)
                .unlockedAt(unlocked != null ? unlocked.getUnlockedAt() : null)
                .build();
    }

    public AchievementDto toUnlockedDto(Achievement a) {
        return toDto(a, UserAchievement.builder()
                .achievement(a)
                .unlockedAt(LocalDateTime.now())
                .build());
    }
}