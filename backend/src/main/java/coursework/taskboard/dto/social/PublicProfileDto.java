package coursework.taskboard.dto.social;

import coursework.taskboard.dto.achievement.AchievementDto;
import coursework.taskboard.dto.shop.BackgroundDto;
import coursework.taskboard.dto.template.GuideDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Полная «витрина» профиля в стиле Steam.
 *
 * friendStatus: SELF | FRIENDS | REQUEST_SENT | REQUEST_RECEIVED | NONE.
 * achievements — только полученные, для вкладки «Выполненные ачивки».
 * showcase — до трёх выбранных достижений (витрина).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileDto {
    private Long id;
    private String username;
    private String displayName;
    private String bio;
    private LocalDateTime memberSince;
    private Boolean isAdmin;

    private String avatarCode;
    private String avatarEmoji;
    private String avatarImageUrl;
    private String avatarUrl;
    private String frameCssClass;
    private String backgroundCode;
    private String backgroundCssClass;
    private String backgroundImageUrl;
    private List<BackgroundDto> backgrounds;

    private Integer leaves;
    private Integer streakDays;
    private Long tasksDoneTotal;
    private Integer achievementsUnlocked;
    private Integer achievementsTotal;
    private Integer level;

    private String friendStatus;
    private Integer friendsCount;
    private Integer incomingRequests;
    private List<SocialUserDto> friends;

    private List<AchievementDto> achievements;
    private List<AchievementDto> showcase;
    private List<GuideDto> guideShowcase;
    private List<ProfileWallPostDto> wall;
}
