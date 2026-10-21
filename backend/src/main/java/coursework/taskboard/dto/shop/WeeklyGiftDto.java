package coursework.taskboard.dto.shop;

import lombok.*;

import java.time.LocalDateTime;

/** Подарок недели глазами пользователя. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyGiftDto {

    /** Настроен ли подарок на текущую неделю. */
    private Boolean configured;

    /** Включён ли он в админке. */
    private Boolean enabled;

    /** Понедельник текущей недели (ISO). */
    private String weekStart;

    /** Воскресенье текущей недели (ISO). */
    private String weekEnd;

    private String itemType;
    private String itemCode;
    private Long itemId;
    private String title;
    private String description;
    private String imageUrl;
    private String emoji;
    private String cssClass;
    private String hexColor;
    private String hexColorSecondary;
    private String hexColorTertiary;
    private Boolean isGradient;
    private Boolean isRare;
    private Integer price;

    private Integer requiredTasks;
    private Long doneTasks;

    /** none | locked | claimable | claimed */
    private String state;

    private Boolean canClaim;
    private Boolean claimed;
    private LocalDateTime claimedAt;

    /** Предмет уже есть в коллекции пользователя. */
    private Boolean owned;
}
