package coursework.taskboard.dto.achievement;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDto {

    private Long id;
    private String code;
    private String title;
    private String description;
    private String icon;
    private String accentCode;
    private Integer threshold;

    /** Получена ли пользователем */
    private Boolean unlocked;

    /** Когда получена (если получена) */
    private LocalDateTime unlockedAt;

    /** Сколько листьев даёт */
    private Integer reward;

    /** Предмет-награда — тип ('ACCENT' | 'FRAME' | 'AVATAR' | 'TREE' | null) */
    private String rewardItemType;

    /** Предмет-награда — code ('oak', 'forest', ...) */
    private String rewardItemCode;

    /** Название предмета для UI (заполняется на бэке) */
    private String rewardItemTitle;
}